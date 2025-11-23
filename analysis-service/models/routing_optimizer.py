"""
Routing optimization using Google OR-Tools
"""

from typing import List, Dict, Any, Optional
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta

# Import OR-Tools (lazy loading)
ortools_available = True
try:
    from ortools.constraint_solver import routing_enums_pb2
    from ortools.constraint_solver import pywrapcp
except ImportError:
    ortools_available = False

logger = logging.getLogger(__name__)

@dataclass
class Location:
    id: str
    lat: float
    lng: float
    demand: float = 0

@dataclass
class Vehicle:
    id: int
    capacity: float
    start_location: Location

@dataclass
class RouteResult:
    vehicle_id: int
    stops: List[Location]
    total_distance: float
    total_time: float
    total_cost: float
    emissions: float

class RouteOptimizer:
    """Vehicle Routing Problem optimizer using Google OR-Tools"""

    def __init__(self):
        if not ortools_available:
            raise ImportError("Google OR-Tools not available. Install with: pip install ortools")

    def calculate_distance(self, loc1: Location, loc2: Location) -> float:
        """Calculate distance between two locations using Haversine formula"""
        import math

        R = 6371  # Earth's radius in km

        lat1_rad = math.radians(loc1.lat)
        lng1_rad = math.radians(loc1.lng)
        lat2_rad = math.radians(loc2.lat)
        lng2_rad = math.radians(loc2.lng)

        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad

        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

        return R * c

    def optimize_routes(self,
                       warehouse: Location,
                       delivery_points: List[Location],
                       vehicle_capacity: float,
                       vehicle_count: int = 1,
                       optimization_goal: str = "distance") -> List[RouteResult]:
        """
        Solve Vehicle Routing Problem

        Args:
            warehouse: Starting location (depot)
            delivery_points: List of delivery locations
            vehicle_capacity: Capacity per vehicle
            vehicle_count: Number of vehicles
            optimization_goal: 'distance', 'time', 'cost', or 'emissions'

        Returns:
            List of optimized routes
        """

        # Create locations list with depot first
        locations = [warehouse] + delivery_points
        num_locations = len(locations)

        # Create distance matrix
        distance_matrix = []
        for i in range(num_locations):
            row = []
            for j in range(num_locations):
                distance = self.calculate_distance(locations[i], locations[j])
                row.append(int(distance * 1000))  # Convert to meters for OR-Tools
            distance_matrix.append(row)

        # Create routing model
        manager = pywrapcp.RoutingIndexManager(num_locations, vehicle_count, 0)
        routing = pywrapcp.RoutingModel(manager)

        # Define cost function
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return distance_matrix[from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)

        # Set cost function
        if optimization_goal == "distance":
            routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        elif optimization_goal == "time":
            # Assume 50 km/h average speed
            def time_callback(from_index, to_index):
                distance = distance_callback(from_index, to_index)
                return int(distance / 50 * 3600)  # Convert to seconds
            time_callback_index = routing.RegisterTransitCallback(time_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(time_callback_index)
        elif optimization_goal == "cost":
            # Assume cost per km
            def cost_callback(from_index, to_index):
                distance = distance_callback(from_index, to_index)
                return int(distance * 1000)  # Assume 1000 IDR per km
            cost_callback_index = routing.RegisterTransitCallback(cost_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(cost_callback_index)
        elif optimization_goal == "emissions":
            # CO2 emissions per km (rough estimate)
            def emissions_callback(from_index, to_index):
                distance = distance_callback(from_index, to_index)
                return int(distance * 0.1 * 1000)  # 0.1 kg CO2 per km
            emissions_callback_index = routing.RegisterTransitCallback(emissions_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(emissions_callback_index)

        # Add capacity constraint
        def demand_callback(from_index):
            from_node = manager.IndexToNode(from_index)
            return int(locations[from_node].demand)

        demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
        routing.AddDimensionWithVehicleCapacity(
            demand_callback_index,
            0,  # null capacity slack
            [int(vehicle_capacity) for _ in range(vehicle_count)],  # vehicle capacities
            True,  # start cumul to zero
            'Capacity'
        )

        # Set search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = 30  # 30 second time limit

        # Solve the problem
        solution = routing.SolveWithParameters(search_parameters)

        if solution:
            routes = []
            total_distance = 0
            total_cost = 0
            total_emissions = 0

            for vehicle_id in range(vehicle_count):
                route_stops = []
                index = routing.Start(vehicle_id)

                while not routing.IsEnd(index):
                    node_index = manager.IndexToNode(index)
                    location = locations[node_index]
                    route_stops.append(location)
                    index = solution.Value(routing.NextVar(index))

                # Add depot as final stop
                route_stops.append(warehouse)

                # Calculate route metrics
                route_distance = 0
                route_demand = 0
                for i in range(len(route_stops) - 1):
                    dist = self.calculate_distance(route_stops[i], route_stops[i+1])
                    route_distance += dist
                    route_demand += route_stops[i].demand

                # Estimate time (50 km/h average)
                route_time = route_distance / 50

                # Estimate cost (IDR per km)
                route_cost = route_distance * 1000

                # Estimate emissions (kg CO2)
                route_emissions = route_distance * 0.1

                routes.append(RouteResult(
                    vehicle_id=vehicle_id,
                    stops=route_stops,
                    total_distance=route_distance,
                    total_time=route_time,
                    total_cost=route_cost,
                    emissions=route_emissions
                ))

                total_distance += route_distance
                total_cost += route_cost
                total_emissions += route_emissions

            return routes
        else:
            logger.warning("No solution found for VRP")
            return []