"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useNavigation } from '@/hooks/useNavigation';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import dynamic from 'next/dynamic';
import { forecastApi } from '@/lib/api-client';
import {
  TrendingUp,
  Truck,
  Map,
  Shield,
  Brain,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Dynamically import ChoroplethMap to avoid SSR issues
const ChoroplethMap = dynamic(() => import("@/components/feature/forecast/ChoroplethMap"), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">Loading map...</div>
});

export default function DashboardPage() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { navigateTo } = useNavigation();
  const { isLoading: isGlobalLoading, loadingMessage } = useGlobalLoading();

  // Choropleth map data
  const [choroplethData, setChoroplethData] = useState<{
    geoJson: any;
    data: { [key: string]: number };
    mode: 'stock' | 'forecast';
  } | null>(null);

  // Mock data for dashboard metrics
  const dashboardMetrics = {
    totalDemand: 1250,
    activeRoutes: 8,
    complianceRate: 94.2,
    alertsCount: 3,
    stockLevels: {
      safe: 15,
      warning: 3,
      critical: 1
    }
  };

  useEffect(() => {
    const fetchChoroplethData = async () => {
      try {
        const data = await forecastApi.getChoroplethData('stock', 'west-java');
        setChoroplethData(data);
      } catch (error) {
        console.error('Failed to fetch choropleth data:', error);
        // Keep null data, map will show empty
      }
    };

    fetchChoroplethData();

    // Simulate loading time
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const quickActions = [
    {
      title: "Generate Forecast",
      description: "Predict demand with CatBoost AI",
      icon: TrendingUp,
      href: "/forecast",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Optimize Routes",
      description: "Plan eco-smart delivery routes",
      icon: Truck,
      href: "/tracking",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Monitor Compliance",
      description: "Check HET compliance & inventory",
      icon: Shield,
      href: "/data",
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "AI Assistant",
      description: "Get intelligent insights & help",
      icon: Brain,
      href: "/assistant",
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <>
      {(isInitialLoading || isGlobalLoading) && (
        <LoadingScreen
          isLoading={isInitialLoading || isGlobalLoading}
          message={isInitialLoading ? "Loading PUKPUK Dashboard..." : loadingMessage}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950 dark:via-gray-900 dark:to-green-950">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <div className="flex justify-center">
              <Image
                src="/logo.svg"
                alt="Pukpuk Logo"
                width={80}
                height={80}
                className="drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              PUKPUK Ecosystem Dashboard
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Intelligent fertilizer supply chain optimization powered by CatBoost AI and geospatial analytics
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Demand (Tons)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.totalDemand.toLocaleString('en-US')}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.activeRoutes}</div>
                <p className="text-xs text-muted-foreground">5 optimized today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">HET Compliance</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.complianceRate}%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.alertsCount}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Choropleth Map */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Map className="h-5 w-5 mr-2" />
                    Live Choropleth Map
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Activity className="h-4 w-4 mr-1" />
                      Live Stock View
                    </Button>
                    <Button variant="outline" size="sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Forecast View
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-96 rounded-lg overflow-hidden">
                    <ChoroplethMap
                      geoJsonData={choroplethData?.geoJson || null}
                      data={choroplethData?.data || {}}
                      mode="stock"
                      onRegionClick={(regionId) => console.log('Region clicked:', regionId)}
                    />
                  </div>
                  <div className="flex justify-between mt-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                      Safe Stock ({dashboardMetrics.stockLevels.safe} regions)
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                      Warning ({dashboardMetrics.stockLevels.warning} regions)
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                      Critical ({dashboardMetrics.stockLevels.critical} regions)
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      onClick={() => navigateTo(action.href)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${action.color} text-white`}>
                          <action.icon className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-sm text-muted-foreground">{action.description}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm">Forecast generated for West Java region</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Truck className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm">Route optimized for 3 delivery points</p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="h-4 w-4 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-sm">HET compliance check completed</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm">Low stock alert in Indramayu district</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* AI Insights Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                    <span className="font-medium">Demand Surge Alert</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    NDVI data indicates vegetative phase starting in Indramayu. Expect 200 tons Urea demand surge in 7 days.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <Truck className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="font-medium">Route Optimization</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cirebon warehouse has 500 tons surplus. Recommend transfer to Indramayu for optimal distribution.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <Shield className="h-4 w-4 text-purple-500 mr-2" />
                    <span className="font-medium">Compliance Check</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    3 kiosks flagged for HET violations. Automated WhatsApp audits initiated for farmer verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>PUKPUK Ecosystem - Democratizing AI for Inclusive and Transparent Fertilizer Supply Chain Optimization</p>
          </div>
        </div>
      </div>
    </>
  );
}
