"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIAssistantPanel } from "@/components/feature/ai-assistant/AIAssistantPanel";
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import {
  MessageSquare,
  Zap,
  Brain,
  Database,
  TrendingUp,
  Truck,
  Shield,
  BookOpen,
  Play,
  Settings,
  Bot
} from 'lucide-react';

export default function AssistantPage() {
  const { isLoading: isGlobalLoading, loadingMessage } = useGlobalLoading();

  // Mock knowledge base entries
  const knowledgeBase = [
    {
      category: "Forecasting",
      title: "CatBoost Model Parameters",
      description: "Understanding iteration count, learning rate, and depth parameters",
      type: "documentation"
    },
    {
      category: "Route Optimization",
      title: "Google OR-Tools VRP",
      description: "Vehicle Routing Problem algorithms and constraints",
      type: "tutorial"
    },
    {
      category: "Compliance",
      title: "HET Price Regulations",
      description: "Indonesian fertilizer price controls and monitoring",
      type: "regulation"
    },
    {
      category: "AI Integration",
      title: "Gemini API Usage",
      description: "Natural language processing for agentic AI features",
      type: "api-reference"
    }
  ];

  // Mock recent tasks
  const recentTasks = [
    {
      id: "task-1",
      title: "Generate demand forecast for West Java",
      status: "completed",
      timestamp: "2 hours ago",
      result: "Forecast generated with 94% accuracy"
    },
    {
      id: "task-2",
      title: "Optimize delivery routes for 5 vehicles",
      status: "running",
      timestamp: "15 minutes ago",
      result: "Processing multi-objective optimization..."
    },
    {
      id: "task-3",
      title: "Check HET compliance for 12 kiosks",
      status: "pending",
      timestamp: "5 minutes ago",
      result: "Queued for execution"
    }
  ];

  const quickActions = [
    {
      title: "Generate Forecast",
      description: "Create demand prediction with CatBoost",
      icon: TrendingUp,
      action: "generate_forecast",
      color: "bg-blue-500"
    },
    {
      title: "Optimize Routes",
      description: "Plan efficient delivery routes",
      icon: Truck,
      action: "optimize_routes",
      color: "bg-green-500"
    },
    {
      title: "Compliance Check",
      description: "Verify HET price compliance",
      icon: Shield,
      action: "check_compliance",
      color: "bg-purple-500"
    },
    {
      title: "Data Analysis",
      description: "Analyze sales and market data",
      icon: Database,
      action: "analyze_data",
      color: "bg-orange-500"
    }
  ];

  return (
    <>
      {isGlobalLoading && (
        <LoadingScreen
          isLoading={isGlobalLoading}
          message={loadingMessage}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Agentic AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Dual-mode AI assistant with conversational chat and automated task execution capabilities
          </p>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat Mode
            </TabsTrigger>
            <TabsTrigger value="task" className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Task Execution
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              Task History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Quick Actions Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto p-4"
                        onClick={() => console.log('Execute action:', action.action)}
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

                {/* AI Capabilities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bot className="h-5 w-5 mr-2" />
                      AI Capabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Natural Language Processing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Data Analysis & Insights</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Predictive Modeling</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Automated Task Execution</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Interface */}
              <div className="lg:col-span-3">
                <Card className="h-[600px]">
                  <CardContent className="p-0 h-full">
                    <AIAssistantPanel />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="task" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Play className="h-5 w-5 mr-2" />
                    Task Execution Engine
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure and execute automated tasks using AI agents
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Task Type</label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Generate Demand Forecast</option>
                        <option>Optimize Delivery Routes</option>
                        <option>Compliance Audit</option>
                        <option>Data Analysis</option>
                        <option>Report Generation</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Parameters</label>
                      <textarea
                        className="w-full p-2 border rounded-md min-h-[100px]"
                        placeholder="Specify task parameters in natural language..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Execution Mode</label>
                      <div className="flex space-x-2">
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="mode" defaultChecked />
                          <span className="text-sm">Synchronous</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="radio" name="mode" />
                          <span className="text-sm">Asynchronous</span>
                        </label>
                      </div>
                    </div>

                    <Button className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Execute Task
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Task Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Task Execution Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTasks.map((task) => (
                      <div key={task.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <Badge variant={
                            task.status === 'completed' ? 'default' :
                            task.status === 'running' ? 'secondary' : 'outline'
                          }>
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{task.result}</p>
                        <div className="text-xs text-muted-foreground">{task.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  PUKPUK Knowledge Base
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Comprehensive documentation and resources for the PUKPUK ecosystem
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {knowledgeBase.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge variant={
                          item.type === 'documentation' ? 'default' :
                          item.type === 'tutorial' ? 'secondary' :
                          item.type === 'regulation' ? 'destructive' : 'outline'
                        }>
                          {item.type}
                        </Badge>
                      </div>
                      <h3 className="font-medium mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                      <Button variant="outline" size="sm">
                        Read More
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Task Execution History
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete history of AI agent task executions and results
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTasks.concat([
                    {
                      id: "task-4",
                      title: "Monthly compliance report generation",
                      status: "completed",
                      timestamp: "1 day ago",
                      result: "Report generated with 156 kiosk audits"
                    },
                    {
                      id: "task-5",
                      title: "Route optimization for emergency delivery",
                      status: "completed",
                      timestamp: "2 days ago",
                      result: "Optimized route saved 3 hours and reduced emissions by 15kg CO₂"
                    }
                  ]).map((task) => (
                    <div key={task.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge variant={
                          task.status === 'completed' ? 'default' :
                          task.status === 'running' ? 'secondary' : 'outline'
                        }>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.result}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">{task.timestamp}</div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View Details</Button>
                          <Button variant="outline" size="sm">Re-run</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
