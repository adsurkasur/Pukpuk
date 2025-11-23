"""
Pukpuk Analysis Service
A FastAPI-based service for agricultural demand forecasting using multiple ML models.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import os
from contextlib import asynccontextmanager

# Import our custom modules
from models.forecast_models import ForecastEngine
from models.data_processor import DataProcessor
from models.routing_optimizer import RouteOptimizer
from models.compliance_monitor import ComplianceMonitor
from utils.config import settings
from utils.logger import setup_logger

# Setup logging
logger = setup_logger(__name__)

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        logger.info("Starting Pukpuk Analysis Service")
        # Test forecast engine initialization
        engine = ForecastEngine()
        logger.info("Forecast engine initialized successfully")
        yield
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        # Don't re-raise the exception to prevent server shutdown
        yield
    finally:
        # Shutdown
        logger.info("Shutting down Pukpuk Analysis Service")

# Create FastAPI app
app = FastAPI(
    title="Pukpuk Analysis Service",
    description="Advanced agricultural demand forecasting using ensemble ML models",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for Next.js integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.huggingface.co",
        "https://huggingface.co",
        os.getenv("FRONTEND_URL", "*")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class DemandData(BaseModel):
    date: str = Field(..., description="ISO date string")
    quantity: float = Field(..., gt=0, description="Demand quantity")
    price: float = Field(..., gt=0, description="Price per unit")

class ForecastRequest(BaseModel):
    product_id: str = Field(..., description="Product identifier")
    historical_data: List[DemandData] = Field(..., min_items=3, description="Historical demand data")
    days: int = Field(..., ge=1, le=365, description="Forecast horizon in days")
    selling_price: Optional[float] = Field(None, gt=0, description="Selling price for revenue calculation")
    date_from: Optional[str] = Field(None, description="Start date for historical data filter")
    date_to: Optional[str] = Field(None, description="End date for historical data filter")
    models: Optional[List[str]] = Field(["ensemble"], description="Models to use for forecasting")
    include_confidence: Optional[bool] = Field(True, description="Include confidence intervals")
    scenario: Optional[str] = Field("realistic", description="Forecast scenario")
    location: Optional[Dict[str, float]] = Field(None, description="Location coordinates {'lat': float, 'lng': float} for NDVI data")

class ForecastDataPoint(BaseModel):
    date: str = Field(..., description="Forecast date")
    predicted_value: float = Field(..., description="Predicted demand/price")
    confidence_lower: Optional[float] = Field(None, description="Lower confidence bound")
    confidence_upper: Optional[float] = Field(None, description="Upper confidence bound")
    model_used: Optional[str] = Field(None, description="Model that generated this prediction")

class RevenueProjection(BaseModel):
    date: str = Field(..., description="Projection date")
    projected_quantity: float = Field(..., description="Projected quantity")
    selling_price: float = Field(..., description="Selling price")
    projected_revenue: float = Field(..., description="Projected revenue")
    confidence_lower: Optional[float] = Field(None, description="Lower revenue confidence")
    confidence_upper: Optional[float] = Field(None, description="Upper revenue confidence")

class ForecastResponse(BaseModel):
    forecast_data: List[ForecastDataPoint] = Field(..., description="Forecast data points")
    revenue_projection: Optional[List[RevenueProjection]] = Field(None, description="Revenue projections")
    models_used: List[str] = Field(..., description="ML models used for forecasting")
    summary: str = Field(..., description="AI-generated summary of forecast")
    confidence: float = Field(..., description="Overall forecast confidence score")
    scenario: Optional[str] = Field(None, description="Forecast scenario used")
    metadata: Dict[str, Any] = Field(..., description="Additional forecast metadata")

class RouteOptimizationRequest(BaseModel):
    warehouse_location: Dict[str, float] = Field(..., description="Warehouse coordinates {'lat': float, 'lng': float}")
    delivery_points: List[Dict[str, Any]] = Field(..., description="List of delivery points with coordinates and demands")
    vehicle_capacity: float = Field(..., description="Vehicle capacity in tons")
    vehicle_count: int = Field(1, description="Number of vehicles available")
    optimization_goal: str = Field("distance", description="Optimization goal: 'distance', 'time', 'cost', 'emissions'")

class RouteStop(BaseModel):
    location_id: str = Field(..., description="Location identifier")
    coordinates: Dict[str, float] = Field(..., description="Coordinates {'lat': float, 'lng': float}")
    demand: float = Field(..., description="Demand at this location")
    arrival_time: Optional[str] = Field(None, description="Estimated arrival time")
    departure_time: Optional[str] = Field(None, description="Estimated departure time")

class Route(BaseModel):
    vehicle_id: int = Field(..., description="Vehicle identifier")
    stops: List[RouteStop] = Field(..., description="Ordered list of stops")
    total_distance: float = Field(..., description="Total route distance in km")
    total_time: float = Field(..., description="Total route time in hours")
    total_cost: float = Field(..., description="Total route cost")
    emissions: float = Field(..., description="CO2 emissions in kg")

class RouteOptimizationResponse(BaseModel):
    routes: List[Route] = Field(..., description="Optimized routes for all vehicles")
    total_distance: float = Field(..., description="Total distance across all routes")
    total_cost: float = Field(..., description="Total cost across all routes")
    total_emissions: float = Field(..., description="Total CO2 emissions across all routes")
    optimization_summary: str = Field(..., description="Summary of optimization results")

class ComplianceCheckRequest(BaseModel):
    kiosk_id: str = Field(..., description="Kiosk identifier")
    farmer_phone: str = Field(..., description="Farmer's WhatsApp number with country code")
    transaction_details: Dict[str, Any] = Field(..., description="Transaction details")
    het_price: float = Field(..., description="Maximum retail price (HET)")

class ComplianceCheckResponse(BaseModel):
    verification_sent: bool = Field(..., description="Whether verification was sent")
    transaction_parsed: bool = Field(..., description="Whether transaction was parsed successfully")
    parsed_transaction: Optional[Dict[str, Any]] = Field(None, description="Parsed transaction data")
    status: str = Field(..., description="Check status")

class ChatParseRequest(BaseModel):
    chat_message: str = Field(..., description="Raw chat message from kiosk")

class ChatParseResponse(BaseModel):
    parsed: bool = Field(..., description="Whether parsing was successful")
    transaction_data: Optional[Dict[str, Any]] = Field(None, description="Parsed transaction data")
    revenue_projection: Optional[List[RevenueProjection]] = Field(None, description="Revenue projections")
    models_used: List[str] = Field(..., description="Models used in forecasting")
    summary: str = Field(..., description="AI-generated summary in Markdown")
    confidence: Optional[float] = Field(None, description="Overall forecast confidence")
    scenario: Optional[str] = Field(None, description="Applied scenario")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

# Dependency injection
def get_forecast_engine() -> ForecastEngine:
    """Dependency injection for forecast engine"""
    return ForecastEngine()

def get_data_processor() -> DataProcessor:
    """Dependency injection for data processor"""
    return DataProcessor()

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "analysis-service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# API Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "analysis-service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

# Helper functions for forecast generation
def validate_historical_data(df: pd.DataFrame) -> None:
    """Validate that historical data meets minimum requirements"""
    if len(df) < 3:
        raise HTTPException(
            status_code=400,
            detail="Insufficient historical data. Need at least 3 data points."
        )

def prepare_forecast_metadata(request: ForecastRequest, df: pd.DataFrame) -> Dict[str, Any]:
    """Prepare metadata for forecast response"""
    return {
        "data_points": len(df),
        "forecast_horizon": request.days,
        "product_id": request.product_id,
        "generated_at": datetime.utcnow().isoformat(),
        "scenario": request.scenario
    }

def calculate_revenue_if_needed(
    forecast_engine: ForecastEngine,
    request: ForecastRequest,
    forecast_result: Dict[str, Any],
    df: pd.DataFrame
) -> Optional[List[RevenueProjection]]:
    """Calculate revenue projection if selling price is provided"""
    if request.selling_price and request.selling_price > 0:
        return forecast_engine.calculate_revenue_projection(
            forecast_data=forecast_result["forecast_data"],
            selling_price=request.selling_price,
            historical_data=df
        )
    return None

@app.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(
    request: ForecastRequest,
    forecast_engine: ForecastEngine = Depends(get_forecast_engine),
    data_processor: DataProcessor = Depends(get_data_processor)
):
    """
    Generate demand forecast using ensemble ML models
    """
    try:
        logger.info(f"Generating forecast for product {request.product_id}")

        # Process and validate data
        df = data_processor.process_historical_data(request.historical_data)
        validate_historical_data(df)

        # Fetch NDVI data if location provided
        if request.location:
            start_date = df['date'].min().strftime('%Y-%m-%d')
            end_date = (df['date'].max() + timedelta(days=request.days)).strftime('%Y-%m-%d')
            ndvi_df = data_processor.fetch_ndvi_data(
                lat=request.location['lat'],
                lng=request.location['lng'],
                start_date=start_date,
                end_date=end_date
            )
            df = data_processor.merge_ndvi_with_demand(df, ndvi_df)

        # Generate forecast
        forecast_result = await forecast_engine.generate_forecast(
            df=df,
            days=request.days,
            models=request.models or ["ensemble"],
            include_confidence=request.include_confidence,
            scenario=request.scenario
        )

        # Calculate revenue projection if needed
        revenue_projection = calculate_revenue_if_needed(forecast_engine, request, forecast_result, df)

        # Generate AI summary and confidence
        summary = forecast_engine.generate_summary(
            forecast_data=forecast_result["forecast_data"],
            historical_data=df,
            models_used=forecast_result["models_used"],
            scenario=request.scenario
        )

        confidence = forecast_engine.calculate_overall_confidence(
            forecast_data=forecast_result["forecast_data"]
        )

        # Prepare response
        metadata = prepare_forecast_metadata(request, df)
        response = ForecastResponse(
            forecast_data=forecast_result["forecast_data"],
            revenue_projection=revenue_projection,
            models_used=forecast_result["models_used"],
            summary=summary,
            confidence=confidence,
            scenario=request.scenario,
            metadata=metadata
        )

        logger.info(f"Successfully generated forecast for product {request.product_id}")
        return response

    except Exception as e:
        logger.error(f"Forecast generation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Forecast generation failed: {str(e)}"
        )

@app.post("/optimize-route", response_model=RouteOptimizationResponse)
async def optimize_delivery_route(request: RouteOptimizationRequest):
    """Optimize delivery routes using Vehicle Routing Problem solver"""
    try:
        logger.info("Starting route optimization")

        # Initialize route optimizer
        optimizer = RouteOptimizer()

        # Convert request data to Location objects
        warehouse = Location(
            id="warehouse",
            lat=request.warehouse_location["lat"],
            lng=request.warehouse_location["lng"],
            demand=0
        )

        delivery_locations = []
        for point in request.delivery_points:
            delivery_locations.append(Location(
                id=point.get("id", f"point_{len(delivery_locations)}"),
                lat=point["coordinates"]["lat"],
                lng=point["coordinates"]["lng"],
                demand=point.get("demand", 0)
            ))

        # Optimize routes
        routes = optimizer.optimize_routes(
            warehouse=warehouse,
            delivery_points=delivery_locations,
            vehicle_capacity=request.vehicle_capacity,
            vehicle_count=request.vehicle_count,
            optimization_goal=request.optimization_goal
        )

        # Convert to response format
        response_routes = []
        total_distance = 0
        total_cost = 0
        total_emissions = 0

        for route in routes:
            stops = []
            for stop in route.stops:
                stops.append(RouteStop(
                    location_id=stop.id,
                    coordinates={"lat": stop.lat, "lng": stop.lng},
                    demand=stop.demand
                ))

            response_routes.append(Route(
                vehicle_id=route.vehicle_id,
                stops=stops,
                total_distance=round(route.total_distance, 2),
                total_time=round(route.total_time, 2),
                total_cost=round(route.total_cost, 2),
                emissions=round(route.emissions, 2)
            ))

            total_distance += route.total_distance
            total_cost += route.total_cost
            total_emissions += route.emissions

        optimization_summary = f"Optimized {len(response_routes)} routes for {len(delivery_locations)} delivery points. " \
                              f"Total distance: {round(total_distance, 2)} km, " \
                              f"Total cost: IDR {round(total_cost, 2)}, " \
                              f"Total emissions: {round(total_emissions, 2)} kg CO2"

        response = RouteOptimizationResponse(
            routes=response_routes,
            total_distance=round(total_distance, 2),
            total_cost=round(total_cost, 2),
            total_emissions=round(total_emissions, 2),
            optimization_summary=optimization_summary
        )

        logger.info("Route optimization completed successfully")
        return response

    except Exception as e:
        logger.error(f"Route optimization failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Route optimization failed: {str(e)}"
        )

@app.post("/compliance-check", response_model=ComplianceCheckResponse)
async def check_compliance(request: ComplianceCheckRequest):
    """Send compliance verification via WhatsApp"""
    try:
        logger.info(f"Processing compliance check for kiosk {request.kiosk_id}")

        monitor = ComplianceMonitor()

        # Parse transaction if not already parsed
        parsed_transaction = request.transaction_details
        transaction_parsed = True

        # Send verification
        verification_sent = monitor.send_verification_request(
            farmer_phone=request.farmer_phone,
            kiosk_name=request.kiosk_id,
            transaction_details={
                **parsed_transaction,
                'het_price': request.het_price
            }
        )

        response = ComplianceCheckResponse(
            verification_sent=verification_sent,
            transaction_parsed=transaction_parsed,
            parsed_transaction=parsed_transaction,
            status="verification_sent" if verification_sent else "failed"
        )

        logger.info(f"Compliance check completed: {response.status}")
        return response

    except Exception as e:
        logger.error(f"Compliance check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Compliance check failed: {str(e)}"
        )

@app.post("/parse-chat", response_model=ChatParseResponse)
async def parse_chat_message(request: ChatParseRequest):
    """Parse transaction details from kiosk chat message"""
    try:
        logger.info("Parsing chat message for transaction data")

        monitor = ComplianceMonitor()
        transaction_data = monitor.parse_chat_transaction(request.chat_message)

        response = ChatParseResponse(
            parsed=transaction_data is not None,
            transaction_data=transaction_data
        )

        logger.info(f"Chat parsing completed: {'success' if response.parsed else 'failed'}")
        return response

    except Exception as e:
        logger.error(f"Chat parsing failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Chat parsing failed: {str(e)}"
        )

@app.get("/models")
async def list_available_models():
    """List all available forecasting models"""
    return {
        "models": [
            {
                "id": "ensemble",
                "name": "Ensemble (Recommended)",
                "description": "Combines multiple models for best accuracy",
                "type": "ensemble"
            },
            {
                "id": "sma",
                "name": "Simple Moving Average",
                "description": "Basic trend analysis",
                "type": "statistical"
            },
            {
                "id": "wma",
                "name": "Weighted Moving Average",
                "description": "Recent data weighted more",
                "type": "statistical"
            },
            {
                "id": "es",
                "name": "Exponential Smoothing",
                "description": "Seasonal trend analysis",
                "type": "statistical"
            },
            {
                "id": "arima",
                "name": "ARIMA",
                "description": "Statistical time series model",
                "type": "statistical"
            },
            {
                "id": "catboost",
                "name": "CatBoost",
                "description": "Machine learning model",
                "type": "ml"
            }
        ]
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
