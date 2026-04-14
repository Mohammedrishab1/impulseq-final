import React from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Clock, 
  Filter, 
  MoreVertical,
  Search,
  Volume2,
  Send,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const alerts = [
  { id: 1, type: 'CRITICAL', title: 'Overcrowding Alert', description: 'OPD - General has reached 95% capacity. Average wait time exceeded 60 minutes.', time: '5 mins ago', hospital: 'City General' },
  { id: 2, type: 'WARNING', title: 'Token Device Issue', description: '3 devices in Laboratory are disconnected or have low battery.', time: '12 mins ago', hospital: 'St. Mary\'s' },
  { id: 3, type: 'INFO', title: 'Staff Shift Change', description: 'Afternoon shift staff have checked in for Room 204 and 205.', time: '45 mins ago', hospital: 'City General' },
  { id: 4, type: 'SUCCESS', title: 'Queue Cleared', description: 'Radiology department has successfully cleared the morning backlog.', time: '1 hour ago', hospital: 'Westside Medical' },
];

export function AlertsCenter() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Alerts & Notifications</h1>
          <p className="text-slate-500">Central communication and issue management</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
          <Button className="gap-2">
            <Volume2 className="w-4 h-4" />
            Broadcast Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Tabs defaultValue="all" className="w-full md:w-auto">
                  <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="all">All Alerts</TabsTrigger>
                    <TabsTrigger value="critical">Critical</TabsTrigger>
                    <TabsTrigger value="warning">Warning</TabsTrigger>
                    <TabsTrigger value="info">Info</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search alerts..." className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <AlertCard key={alert.id} {...alert} />
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-6 text-slate-500">Load More Alerts</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Widget</CardTitle>
              <CardDescription>Send instant announcements to all screens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Target Audience</label>
                <select className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option>All Hospitals</option>
                  <option>City General Only</option>
                  <option>Patients Only</option>
                  <option>Staff Only</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Message</label>
                <textarea 
                  className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Type your announcement here..."
                />
              </div>
              <Button className="w-full gap-2">
                <Send className="w-4 h-4" />
                Send Broadcast
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white border-none">
            <CardHeader>
              <CardTitle className="text-white">Notification Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Sent Today</span>
                <span className="font-bold">1,242</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Read Rate</span>
                <span className="font-bold text-success">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Avg Response Time</span>
                <span className="font-bold text-warning">4.5m</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AlertCard({ type, title, description, time, hospital }: any) {
  const config: any = {
    CRITICAL: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/5', border: 'border-destructive/10' },
    WARNING: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/5', border: 'border-warning/10' },
    INFO: { icon: Info, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/10' },
    SUCCESS: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/5', border: 'border-success/10' },
  };

  const { icon: Icon, color, bg, border } = config[type];

  return (
    <div className={cn("flex gap-4 p-4 rounded-xl border transition-all hover:shadow-md", bg, border)}>
      <div className={cn("p-2 rounded-lg h-fit", bg, color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-slate-900">{title}</h4>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{hospital} • {time}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{description}</p>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="h-8 text-xs">Mark Resolved</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs">Escalate</Button>
        </div>
      </div>
    </div>
  );
}
