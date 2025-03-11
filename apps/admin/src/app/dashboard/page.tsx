"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Clock,
  MessageSquare,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Mock data for charts
const conversationData = [
  { time: "10:00", count: 120 },
  { time: "11:00", count: 180 },
  { time: "12:00", count: 240 },
  { time: "13:00", count: 280 },
  { time: "14:00", count: 220 },
  { time: "15:00", count: 190 },
  { time: "16:00", count: 210 },
  { time: "17:00", count: 170 },
  { time: "18:00", count: 150 },
  { time: "19:00", count: 130 },
];

const leadsData = [
  { time: "10:00", count: 15 },
  { time: "11:00", count: 22 },
  { time: "12:00", count: 18 },
  { time: "13:00", count: 25 },
  { time: "14:00", count: 30 },
  { time: "15:00", count: 28 },
  { time: "16:00", count: 40 },
  { time: "17:00", count: 35 },
  { time: "18:00", count: 25 },
  { time: "19:00", count: 20 },
];

import { useEffect, useState } from "react";

// Create a client component for the timestamp
function LastUpdated() {
  const [dateString, setDateString] = useState("");

  useEffect(() => {
    // Only run on client-side
    setDateString(new Date().toLocaleString());
  }, []);

  return <span>{dateString}</span>;
}

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm text-slate-500">
          Last updated: <LastUpdated />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Conversations
                </p>
                <h3 className="text-2xl font-bold mt-1">502</h3>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +12.5%
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Leads
                </p>
                <h3 className="text-2xl font-bold mt-1">97</h3>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  -3.2%
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Avg. Response Time
                </p>
                <h3 className="text-2xl font-bold mt-1">16s</h3>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +8.1%
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Conversion Rate
                </p>
                <h3 className="text-2xl font-bold mt-1">19.3%</h3>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +5.4%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conversation Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="conversations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="response">Response Times</TabsTrigger>
              <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
            </TabsList>

            <TabsContent value="conversations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-slate-500">
                        Total Chats
                      </h4>
                      <p className="text-2xl font-bold mt-1">1,234</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-slate-500">
                        Resolved
                      </h4>
                      <p className="text-2xl font-bold mt-1">1,089</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-slate-500">
                        Resolution Rate
                      </h4>
                      <p className="text-2xl font-bold mt-1">88.2%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="response">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-slate-500">
                        Avg. First Response
                      </h4>
                      <p className="text-2xl font-bold mt-1">45s</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-slate-500">
                        Avg. Response Time
                      </h4>
                      <p className="text-2xl font-bold mt-1">2m 15s</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-slate-500">
                        Resolution Time
                      </h4>
                      <p className="text-2xl font-bold mt-1">15m 30s</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="satisfaction">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-slate-500">
                        CSAT Score
                      </h4>
                      <p className="text-2xl font-bold mt-1">4.8/5.0</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-slate-500">
                        Positive Feedback
                      </h4>
                      <p className="text-2xl font-bold mt-1">92%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-slate-500">
                        NPS Score
                      </h4>
                      <p className="text-2xl font-bold mt-1">75</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
