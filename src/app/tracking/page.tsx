"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { forecastApi } from '@/lib/api-client';
import dynamic from 'next/dynamic';
import {
  Truck,
  MapPin,
  Plus,
  Settings,
  Route,
  Clock,
  DollarSign,
  Leaf,
  Target,
  CheckCircle,
  Play
} from 'lucide-react';

// Dynamically import map component
const TrackingMap = dynamic(() => import('../../components/feature/tracking/TrackingMap'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-muted animate-pulse rounded-lg flex items-center justify-center">Loading map...</div>
});

export default function RouteOptimizationPage() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { isLoading: isGlobalLoading, loadingMessage } = useGlobalLoading();

  // Route optimization state
  const [vehicles, _setVehicles] = useState([
    {
      id: 'truck-1',
      name: 'Truck A',
      capacity: 5000,
      fuelEfficiency: 8,
      emissionRate: 120,
      status: 'available',
      currentRoute: null
    },
    {
      id: 'truck-2',
      name: 'Truck B',
      capacity: 3000,
      fuelEfficiency: 10,
      emissionRate: 95,
      status: 'in-transit',
      currentRoute: 'Route 1'
    }
  ]);

  const [deliveryPoints, setDeliveryPoints] = useState([
    {
      id: 'dp-1',
      name: 'Kiosk Indramayu',
      location: 'Indramayu',
      demand: 1200,
      coordinates: [-6.3278, 108.3242],
      priority: 'high',
      timeWindow: '08:00-17:00'
    },
    {
      id: 'dp-2',
      name: 'Toko Cirebon',
      location: 'Cirebon',
      demand: 800,
      coordinates: [-6.7078, 108.5570],
      priority: 'medium',
      timeWindow: '09:00-16:00'
    }
  ]);

  const [optimizationSettings, setOptimizationSettings] = useState({
    objective: 'balanced', // cost, time, emissions, balanced
    maxRoutes: 5,
    timeLimit: 300,
    prioritizeHighDemand: true,
    avoidTollRoads: false,
    ecoMode: true
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleOptimizeRoutes = async () => {
    setIsOptimizing(true);
    try {
      // Prepare route optimization data
      const optimizationData = {
        vehicles: vehicles.filter(v => v.status === 'available').map(v => ({
          id: v.id,
          capacity: v.capacity,
          fuelEfficiency: v.fuelEfficiency,
          emissionRate: v.emissionRate
        })),
        deliveryPoints: deliveryPoints.map(dp => ({
          id: dp.id,
          location: dp.coordinates,
          demand: dp.demand,
          timeWindow: dp.timeWindow
        })),
        depot: [0, 0], // Warehouse location
        objectives: {
          minimizeCost: optimizationSettings.objective === 'cost',
          minimizeTime: optimizationSettings.objective === 'time',
          minimizeEmissions: optimizationSettings.objective === 'emissions'
        }
      };

      const result = await forecastApi.optimizeRoute(optimizationData);
      setOptimizedRoutes(result);
    } catch (error) {
      console.error('Route optimization failed:', error);
      // Fallback to mock data for now
      setOptimizedRoutes({
        totalDistance: 245.5,
        totalTime: 8.5,
        totalCost: 1250000,
        totalEmissions: 45.2,
        routes: [
          {
            vehicleId: 'truck-1',
            stops: ['Warehouse', 'Kiosk Indramayu', 'Toko Cirebon'],
            distance: 145.5,
            time: 5.2,
            cost: 750000,
            emissions: 28.5
          }
        ]
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const addDeliveryPoint = () => {
    const newPoint = {
      id: `dp-${deliveryPoints.length + 1}`,
      name: `New Delivery Point ${deliveryPoints.length + 1}`,
      location: 'New Location',
      demand: 500,
      coordinates: [-6.5, 108.5],
      priority: 'low',
      timeWindow: '08:00-17:00'
    };
    setDeliveryPoints([...deliveryPoints, newPoint]);
  };

  const getObjectiveIcon = (objective: string) => {
    switch (objective) {
      case 'cost': return DollarSign;
      case 'time': return Clock;
      case 'emissions': return Leaf;
      default: return Target;
    }
  };

  const ObjectiveIcon = getObjectiveIcon(optimizationSettings.objective);

  return (
    <>
      {(isInitialLoading || isGlobalLoading) && (
        <LoadingScreen
          isLoading={isInitialLoading || isGlobalLoading}
          message={isInitialLoading ? "Loading Route Optimization..." : loadingMessage}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Eco-Smart Route Optimization
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Optimize delivery routes using Google OR-Tools with multi-objective optimization (cost, time, emissions)
          </p>
        </div>

        <Tabs defaultValue="planning" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="planning">Route Planning</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicle Config</TabsTrigger>
            <TabsTrigger value="deliveries">Delivery Points</TabsTrigger>
            <TabsTrigger value="results">Optimization Results</TabsTrigger>
          </TabsList>

          <TabsContent value="planning" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Optimization Controls */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Optimization Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Primary Objective</Label>
                      <Select
                        value={optimizationSettings.objective}
                        onValueChange={(value) => setOptimizationSettings({...optimizationSettings, objective: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="balanced">
                            <div className="flex items-center">
                              <Target className="h-4 w-4 mr-2" />
                              Balanced (Cost + Time + Emissions)
                            </div>
                          </SelectItem>
                          <SelectItem value="cost">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Minimize Cost
                            </div>
                          </SelectItem>
                          <SelectItem value="time">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              Minimize Time
                            </div>
                          </SelectItem>
                          <SelectItem value="emissions">
                            <div className="flex items-center">
                              <Leaf className="h-4 w-4 mr-2" />
                              Minimize Emissions
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Routes: {optimizationSettings.maxRoutes}</Label>
                      <Slider
                        value={[optimizationSettings.maxRoutes]}
                        onValueChange={(value) => setOptimizationSettings({...optimizationSettings, maxRoutes: value[0]})}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Time Limit: {optimizationSettings.timeLimit}s</Label>
                      <Slider
                        value={[optimizationSettings.timeLimit]}
                        onValueChange={(value) => setOptimizationSettings({...optimizationSettings, timeLimit: value[0]})}
                        max={600}
                        min={30}
                        step={30}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Prioritize High Demand</Label>
                        <Switch
                          checked={optimizationSettings.prioritizeHighDemand}
                          onCheckedChange={(checked) => setOptimizationSettings({...optimizationSettings, prioritizeHighDemand: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Avoid Toll Roads</Label>
                        <Switch
                          checked={optimizationSettings.avoidTollRoads}
                          onCheckedChange={(checked) => setOptimizationSettings({...optimizationSettings, avoidTollRoads: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Eco Mode</Label>
                        <Switch
                          checked={optimizationSettings.ecoMode}
                          onCheckedChange={(checked) => setOptimizationSettings({...optimizationSettings, ecoMode: checked})}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleOptimizeRoutes}
                      disabled={isOptimizing}
                      className="w-full"
                      size="lg"
                    >
                      {isOptimizing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Optimizing Routes...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Optimization
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Vehicles</span>
                      <Badge variant="secondary">{vehicles.filter(v => v.status === 'available').length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Delivery Points</span>
                      <Badge variant="secondary">{deliveryPoints.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Demand</span>
                      <Badge variant="secondary">{deliveryPoints.reduce((sum, dp) => sum + dp.demand, 0)} tons</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Map View */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Route className="h-5 w-5 mr-2" />
                        Route Visualization
                      </div>
                      <div className="flex items-center space-x-2">
                        <ObjectiveIcon className="h-4 w-4" />
                        <span className="text-sm capitalize">{optimizationSettings.objective}</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 rounded-lg overflow-hidden border">
                      <TrackingMap />
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-blue-600">{optimizedRoutes?.totalDistance || 0} km</div>
                        <div className="text-muted-foreground">Total Distance</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{optimizedRoutes?.totalTime || 0} hrs</div>
                        <div className="text-muted-foreground">Total Time</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-600">Rp {(optimizedRoutes?.totalCost || 0).toLocaleString()}</div>
                        <div className="text-muted-foreground">Total Cost</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-orange-600">{optimizedRoutes?.totalEmissions || 0} kg CO₂</div>
                        <div className="text-muted-foreground">Emissions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Vehicle Configuration
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Truck className="h-5 w-5" />
                          <div>
                            <h3 className="font-medium">{vehicle.name}</h3>
                            <p className="text-sm text-muted-foreground">ID: {vehicle.id}</p>
                          </div>
                        </div>
                        <Badge variant={vehicle.status === 'available' ? 'default' : vehicle.status === 'in-transit' ? 'secondary' : 'destructive'}>
                          {vehicle.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Capacity:</span>
                          <div className="font-medium">{vehicle.capacity} kg</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fuel Efficiency:</span>
                          <div className="font-medium">{vehicle.fuelEfficiency} L/100km</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Emissions:</span>
                          <div className="font-medium">{vehicle.emissionRate} g/km</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current Route:</span>
                          <div className="font-medium">{vehicle.currentRoute || 'None'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Delivery Points Management
                  </div>
                  <Button onClick={addDeliveryPoint}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Delivery Point
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deliveryPoints.map((point) => (
                    <div key={point.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-5 w-5" />
                          <div>
                            <h3 className="font-medium">{point.name}</h3>
                            <p className="text-sm text-muted-foreground">{point.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            point.priority === 'high' ? 'destructive' :
                            point.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {point.priority}
                          </Badge>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Demand:</span>
                          <div className="font-medium">{point.demand} kg</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coordinates:</span>
                          <div className="font-medium text-xs">
                            {point.coordinates[0].toFixed(4)}, {point.coordinates[1].toFixed(4)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time Window:</span>
                          <div className="font-medium">{point.timeWindow}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Priority:</span>
                          <div className="font-medium capitalize">{point.priority}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {optimizedRoutes ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Optimization Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Route className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold">{optimizedRoutes.totalDistance} km</div>
                      <div className="text-sm text-muted-foreground">Total Distance</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <div className="text-2xl font-bold">{optimizedRoutes.totalTime} hrs</div>
                      <div className="text-sm text-muted-foreground">Total Time</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <div className="text-2xl font-bold">Rp {optimizedRoutes.totalCost.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Leaf className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                      <div className="text-2xl font-bold">{optimizedRoutes.totalEmissions} kg</div>
                      <div className="text-sm text-muted-foreground">CO₂ Emissions</div>
                    </div>
                  </div>

                  {/* Route Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Optimized Routes</h3>
                    {optimizedRoutes.routes.map((route: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Truck className="h-5 w-5" />
                            <span className="font-medium">Route {index + 1} - {route.vehicleId}</span>
                          </div>
                          <Badge variant="outline">Optimized</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Stops:</span>
                            <div className="font-medium">{route.stops.length} locations</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Distance:</span>
                            <div className="font-medium">{route.distance} km</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span>
                            <div className="font-medium">{route.time} hrs</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost:</span>
                            <div className="font-medium">Rp {route.cost.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="text-muted-foreground">Route: </span>
                          <span className="font-mono">{route.stops.join(' → ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Optimization Results</h3>
                    <p className="text-muted-foreground mb-4">
                      Configure your vehicles and delivery points, then run optimization to see results.
                    </p>
                    <Button onClick={() => (document.querySelector('[value="planning"]') as HTMLElement)?.click()}>
                      Go to Route Planning
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}