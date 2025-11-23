"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { forecastApi } from '@/lib/api-client';
import {
  Shield,
  AlertTriangle,
  MessageSquare,
  Phone,
  MapPin,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Send,
  Eye,
  Flag
} from 'lucide-react';

export default function CompliancePage() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { isLoading: isGlobalLoading, loadingMessage } = useGlobalLoading();

  // Mock compliance data
  const complianceData = {
    overallCompliance: 94.2,
    totalKiosks: 156,
    compliantKiosks: 147,
    violations: 9,
    pendingAudits: 12,
    recentAudits: [
      {
        id: "AUD001",
        kioskName: "Toko Makmur Jaya",
        location: "Indramayu",
        status: "compliant",
        lastAudit: "2024-01-15",
        violationType: null,
        priceDifference: 0
      },
      {
        id: "AUD002",
        kioskName: "Agro Sentosa",
        location: "Cirebon",
        status: "violation",
        lastAudit: "2024-01-14",
        violationType: "price_above_het",
        priceDifference: 15000
      },
      {
        id: "AUD003",
        kioskName: "Pupuk Berkah",
        location: "Subang",
        status: "pending",
        lastAudit: null,
        violationType: null,
        priceDifference: 0
      }
    ],
    hetPrices: {
      urea: 320000,
      sp36: 280000,
      za: 290000,
      npk: 350000
    },
    alerts: [
      {
        type: "critical",
        message: "3 kiosks selling Urea above HET price in Indramayu district",
        timestamp: "2 hours ago"
      },
      {
        type: "warning",
        message: "12 kiosks pending WhatsApp verification",
        timestamp: "4 hours ago"
      },
      {
        type: "info",
        message: "Monthly compliance report generated",
        timestamp: "1 day ago"
      }
    ]
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500';
      case 'violation': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStartAuditCampaign = async (kioskId: string, farmerPhone: string, transactionDetails: any, hetPrice: number) => {
    try {
      const result = await forecastApi.checkCompliance({
        kioskId,
        farmerPhone,
        transactionDetails,
        hetPrice
      });
      console.log('Compliance check result:', result);
      // Update UI with results
    } catch (error) {
      console.error('Compliance check failed:', error);
    }
  };

  return (
    <>
      {(isInitialLoading || isGlobalLoading) && (
        <LoadingScreen
          isLoading={isInitialLoading || isGlobalLoading}
          message={isInitialLoading ? "Loading Compliance Dashboard..." : loadingMessage}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            HET Compliance Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor fertilizer price compliance and conduct automated WhatsApp audits
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{complianceData.overallCompliance}%</div>
              <p className="text-xs text-muted-foreground">+2.1% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kiosks</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceData.totalKiosks}</div>
              <p className="text-xs text-muted-foreground">{complianceData.compliantKiosks} compliant</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Violations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{complianceData.violations}</div>
              <p className="text-xs text-muted-foreground">Requires immediate action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Audits</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{complianceData.pendingAudits}</div>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Compliance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {complianceData.alerts.map((alert, index) => (
              <Alert key={index} className={
                alert.type === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-950' :
                alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
                'border-blue-500 bg-blue-50 dark:bg-blue-950'
              }>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-center">
                  <span>{alert.message}</span>
                  <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="audits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="audits">Audit Results</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp Audits</TabsTrigger>
            <TabsTrigger value="het-prices">HET Prices</TabsTrigger>
          </TabsList>

          <TabsContent value="audits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Audit Results</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-1" />
                    Export Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceData.recentAudits.map((audit) => (
                    <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(audit.status)}`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{audit.kioskName}</h3>
                            <Badge variant={audit.status === 'compliant' ? 'default' : audit.status === 'violation' ? 'destructive' : 'secondary'}>
                              {audit.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {audit.location}
                            </span>
                            {audit.lastAudit && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {audit.lastAudit}
                              </span>
                            )}
                          </div>
                          {audit.violationType && (
                            <div className="text-sm text-red-600 mt-1">
                              Violation: Price above HET by Rp {audit.priceDifference.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        {audit.status === 'violation' && (
                          <Button variant="outline" size="sm" className="text-red-600 border-red-600">
                            <Flag className="h-4 w-4 mr-1" />
                            Flag
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  WhatsApp Audit System
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Automated farmer verification and price confirmation via WhatsApp
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Active Campaigns</h3>
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Indramayu Urea Audit</span>
                          <Badge>In Progress</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Sent to 45 farmers • 23 responses</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '51%' }}></div>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Cirebon NPK Verification</span>
                          <Badge>Completed</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Sent to 32 farmers • 28 responses</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => handleStartAuditCampaign('kiosk-001', '+6281234567890', { item: 'Urea', quantity: 50 }, 250000)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Start New Audit Campaign
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Phone className="h-4 w-4 mr-2" />
                        Send Bulk Messages
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Response Analytics
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="het-prices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Current HET Prices
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Maximum retail prices set by the Indonesian government
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(complianceData.hetPrices).map(([fertilizer, price]) => (
                    <div key={fertilizer} className="p-4 border rounded-lg text-center">
                      <h3 className="font-medium capitalize mb-2">{fertilizer}</h3>
                      <div className="text-2xl font-bold text-green-600">
                        Rp {price.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">per 50kg bag</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Compliance Reminder</span>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Retailers are legally required to sell fertilizers at or below HET prices. Violations may result in penalties and license suspension.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}