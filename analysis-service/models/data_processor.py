"""
Data processing utilities for Pukpuk Analysis Service
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import requests
from utils.logger import setup_logger
from utils.config import settings

logger = setup_logger(__name__)

class DataProcessor:
    """Handles data processing and validation for forecasting"""

    def __init__(self):
        self.logger = logger

    def process_historical_data(self, historical_data: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Process and validate historical demand data

        Args:
            historical_data: List of demand data points

        Returns:
            Processed pandas DataFrame
        """
        try:
            self.logger.info(f"Processing {len(historical_data)} historical data points")

            # Handle Pydantic model instances - convert to dict if needed
            processed_data = []
            for i, item in enumerate(historical_data):
                if hasattr(item, 'model_dump'):  # Pydantic v2
                    processed_data.append(item.model_dump())
                    self.logger.info(f"Item {i}: Converted Pydantic v2 model")
                elif hasattr(item, 'dict'):  # Pydantic v1
                    processed_data.append(item.dict())
                    self.logger.info(f"Item {i}: Converted Pydantic v1 model")
                else:
                    processed_data.append(item)
                    self.logger.info(f"Item {i}: Already dict - {type(item)}")

            self.logger.info(f"Processed data sample: {processed_data[0] if processed_data else 'None'}")

            # Convert to DataFrame
            df = pd.DataFrame(processed_data)

            self.logger.info(f"DataFrame columns: {list(df.columns)}")
            self.logger.info(f"DataFrame shape: {df.shape}")

            # Validate required columns
            required_columns = ['date', 'quantity', 'price']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                self.logger.error(f"Missing columns: {missing_columns}")
                raise ValueError(f"Missing required columns: {missing_columns}")

            # Convert date column
            df['date'] = pd.to_datetime(df['date'])

            # Validate data types and ranges
            df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce')
            df['price'] = pd.to_numeric(df['price'], errors='coerce')

            # Remove invalid data
            df = df.dropna(subset=['quantity', 'price'])
            df = df[df['quantity'] > 0]
            df = df[df['price'] > 0]

            # Sort by date
            df = df.sort_values('date').reset_index(drop=True)

            # Remove duplicates based on date
            df = df.drop_duplicates(subset=['date'], keep='last')

            # Limit data points if too many
            if len(df) > settings.MAX_DATA_POINTS:
                self.logger.warning(f"Limiting data from {len(df)} to {settings.MAX_DATA_POINTS} points")
                df = df.tail(settings.MAX_DATA_POINTS)

            self.logger.info(f"Successfully processed {len(df)} data points")
            return df

        except Exception as e:
            self.logger.error(f"Data processing failed: {str(e)}")
            raise

    def validate_data_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate data quality and return metrics

        Args:
            df: Processed DataFrame

        Returns:
            Dictionary with quality metrics
        """
        try:
            quality_metrics = {
                'total_points': len(df),
                'date_range': {
                    'start': df['date'].min().isoformat() if len(df) > 0 else None,
                    'end': df['date'].max().isoformat() if len(df) > 0 else None
                },
                'missing_values': {
                    'quantity': df['quantity'].isnull().sum(),
                    'price': df['price'].isnull().sum()
                },
                'outliers': {
                    'quantity': self._detect_outliers(df['quantity']),
                    'price': self._detect_outliers(df['price'])
                },
                'data_completeness': self._calculate_completeness(df)
            }

            return quality_metrics

        except Exception as e:
            self.logger.error(f"Quality validation failed: {str(e)}")
            return {}

    def _detect_outliers(self, series: pd.Series) -> int:
        """Detect outliers using IQR method"""
        try:
            Q1 = series.quantile(0.25)
            Q3 = series.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            outliers = ((series < lower_bound) | (series > upper_bound)).sum()
            return int(outliers)
        except:
            return 0

    def _calculate_completeness(self, df: pd.DataFrame) -> float:
        """Calculate data completeness percentage"""
        try:
            total_cells = len(df) * 2  # quantity and price columns
            missing_cells = df[['quantity', 'price']].isnull().sum().sum()
            completeness = ((total_cells - missing_cells) / total_cells) * 100
            return round(completeness, 2)
        except:
            return 0.0

    def prepare_features_for_ml(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare features for machine learning models

        Args:
            df: Processed DataFrame

        Returns:
            DataFrame with engineered features
        """
        try:
            # Create feature engineering
            feature_df = df.copy()

            # Date-based features
            feature_df['day_of_week'] = feature_df['date'].dt.dayofweek
            feature_df['month'] = feature_df['date'].dt.month
            feature_df['day_of_month'] = feature_df['date'].dt.day
            feature_df['quarter'] = feature_df['date'].dt.quarter

            # Lag features
            for lag in [1, 7, 14, 30]:
                if len(feature_df) > lag:
                    feature_df[f'price_lag_{lag}'] = feature_df['price'].shift(lag)
                    feature_df[f'quantity_lag_{lag}'] = feature_df['quantity'].shift(lag)

            # Rolling statistics
            for window in [7, 14, 30]:
                if len(feature_df) > window:
                    feature_df[f'price_rolling_mean_{window}'] = feature_df['price'].rolling(window).mean()
                    feature_df[f'price_rolling_std_{window}'] = feature_df['price'].rolling(window).std()
                    feature_df[f'quantity_rolling_mean_{window}'] = feature_df['quantity'].rolling(window).mean()

            # Price change features
            feature_df['price_change'] = feature_df['price'].pct_change()
            feature_df['price_change_7d'] = feature_df['price'].pct_change(7)

            # Volume-weighted features
            feature_df['value'] = feature_df['quantity'] * feature_df['price']

            # Drop rows with NaN values created by lag features
            feature_df = feature_df.dropna()

            self.logger.info(f"Created {len(feature_df.columns) - len(df.columns)} additional features")
            return feature_df

        except Exception as e:
            self.logger.error(f"Feature engineering failed: {str(e)}")
            return df

    def fetch_ndvi_data(self, lat: float, lng: float, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Fetch NDVI (Normalized Difference Vegetation Index) data for location

        Args:
            lat: Latitude
            lng: Longitude
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)

        Returns:
            DataFrame with NDVI data
        """
        try:
            self.logger.info(f"Fetching NDVI data for coordinates ({lat}, {lng}) from {start_date} to {end_date}")

            # In production, this would call a satellite API like:
            # - NASA MODIS API
            # - Sentinel Hub API
            # - Google Earth Engine
            # For now, we'll generate synthetic NDVI data based on seasonal patterns

            date_range = pd.date_range(start=start_date, end=end_date, freq='D')
            ndvi_data = []

            for date in date_range:
                # Simulate NDVI based on Indonesian agricultural seasons
                # NDVI typically ranges from -1 to 1, with higher values indicating healthier vegetation
                day_of_year = date.dayofyear

                # Base NDVI with seasonal variation (higher in wet season)
                base_ndvi = 0.3 + 0.4 * np.sin(2 * np.pi * day_of_year / 365)

                # Add some noise and location-specific variation
                noise = np.random.normal(0, 0.1)
                location_factor = (lat - (-6.2)) * 0.01  # Slight variation by latitude

                ndvi_value = np.clip(base_ndvi + noise + location_factor, -1, 1)

                ndvi_data.append({
                    'date': date,
                    'ndvi': round(ndvi_value, 4),
                    'latitude': lat,
                    'longitude': lng
                })

            df_ndvi = pd.DataFrame(ndvi_data)
            self.logger.info(f"Generated {len(df_ndvi)} NDVI data points")
            return df_ndvi

        except Exception as e:
            self.logger.error(f"NDVI data fetch failed: {str(e)}")
            # Return empty DataFrame on error
            return pd.DataFrame(columns=['date', 'ndvi', 'latitude', 'longitude'])

    def merge_ndvi_with_demand(self, demand_df: pd.DataFrame, ndvi_df: pd.DataFrame) -> pd.DataFrame:
        """
        Merge NDVI data with demand data for forecasting

        Args:
            demand_df: Demand data DataFrame
            ndvi_df: NDVI data DataFrame

        Returns:
            Merged DataFrame
        """
        try:
            self.logger.info("Merging NDVI data with demand data")

            # Ensure date columns are datetime
            demand_df['date'] = pd.to_datetime(demand_df['date'])
            ndvi_df['date'] = pd.to_datetime(ndvi_df['date'])

            # Merge on date
            merged_df = demand_df.merge(ndvi_df[['date', 'ndvi']], on='date', how='left')

            # Forward fill missing NDVI values (satellite data might not be daily)
            merged_df['ndvi'] = merged_df['ndvi'].fillna(method='ffill')

            # If still missing, use seasonal average
            if merged_df['ndvi'].isna().any():
                merged_df['ndvi'] = merged_df['ndvi'].fillna(merged_df['ndvi'].mean())

            self.logger.info(f"Merged data has {len(merged_df)} rows with NDVI data")
            return merged_df

        except Exception as e:
            self.logger.error(f"NDVI merge failed: {str(e)}")
            return demand_df
