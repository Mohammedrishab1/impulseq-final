import React from 'react';
import { 
  Cpu, 
  Battery, 
  BatteryLow, 
  Wifi, 
  WifiOff, 
  Search, 
  Plus, 
  MoreVertical,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getIoTData, getQueue } from '@/lib/api';

export function TokenManagementDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [devices, setDevices] = React.useState<any[]>([]);
  const [queue, setQueue] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [iot, q] = await Promise.all([
          getIoTData(),
          getQueue()
        ]);
        setDevices(iot || []);
        setQueue(q || []);
      } catch (err) {
        console.error("Token fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = React.useMemo(() => ({
    total: devices.length,
    active: devices.filter(d => d.status === 'ACTIVE').length,
    lowBattery: devices.filter(d => d.battery_level < 20).length,
    offline: devices.filter(d => d.status === 'DISCONNECTED').length
  }), [devices]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Syncing IoT devices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Smart Token Inventory</h1>
          <p className="text-slate-500">Manage and monitor physical queue devices • IoT Hub Live</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync All
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Register Device
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewCard title="Total Devices" value={stats.total.toString()} icon={Cpu} />
        <OverviewCard title="Active Now" value={stats.active.toString()} icon={CheckCircle2} variant="success" />
        <OverviewCard title="Low Battery" value={stats.lowBattery.toString()} icon={BatteryLow} variant="warning" />
        <OverviewCard title="Offline" value={stats.offline.toString()} icon={WifiOff} variant="destructive" />
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>Device Hub</CardTitle>
            <CardDescription>Live health status of {devices.length} token units</CardDescription>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search by Device ID..." className="pl-9" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Hardware Rev</TableHead>
                <TableHead>Location Hub</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length > 0 ? devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-bold text-slate-900">{device.device_id}</TableCell>
                  <TableCell>
                    <DeviceStatusBadge status={device.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            device.battery_level < 20 ? "bg-rose-500" : device.battery_level < 50 ? "bg-amber-500" : "bg-emerald-500"
                          )}
                          style={{ width: `${device.battery_level}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{device.battery_level}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">v2.4.{device.id % 10}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-medium">Main Hub</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Ping Device">
                        <Wifi className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    No IoT devices reported in registry.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Network Alerts</CardTitle>
            <CardDescription>IoT maintenance requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.lowBattery > 0 && (
              <AlertItem 
                type="warning" 
                title="Battery Replacement Required" 
                description={`${stats.lowBattery} devices are reporting critically low battery levels.`} 
                time="Checked 1m ago"
              />
            )}
            {stats.offline > 0 && (
              <AlertItem 
                type="destructive" 
                title="Node Communication Failure" 
                description={`${stats.offline} devices have dropped out of the Zigbee mesh network.`} 
                time="Reported Now"
              />
            )}
            <AlertItem 
              type="info" 
              title="System Healthy" 
              description="Overall IoT mesh reliability is currently at 98.4%." 
              time="Monitoring Active"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Load Impact</CardTitle>
            <CardDescription>Wait time vs device availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <UsageBar label="Emergency Response" value={95} />
            <UsageBar label="General OPD" value={68} />
            <UsageBar label="Radiology Node" value={42} />
            <UsageBar label="Main Pharmacy" value={88} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OverviewCard({ title, value, icon: Icon, variant = 'default' }: any) {
  const colors: any = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    destructive: "bg-rose-500/10 text-rose-600",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={cn("p-3 rounded-xl", colors[variant])}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function DeviceStatusBadge({ status }: { status: string }) {
  const variants: any = {
    ACTIVE: { label: 'Online', className: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
    LOW_BATTERY: { label: 'Low Bat', className: 'bg-amber-100 text-amber-600 border-amber-200' },
    DISCONNECTED: { label: 'Offline', className: 'bg-rose-100 text-rose-600 border-rose-200' },
    INACTIVE: { label: 'Idle', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  };
  
  const { label, className } = variants[status] || variants.INACTIVE;
  
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", className)}>
      {label}
    </Badge>
  );
}

function AlertItem({ type, title, description, time }: any) {
  const icons: any = {
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    destructive: <AlertTriangle className="w-5 h-5 text-rose-500" />,
    info: <RefreshCw className="w-5 h-5 text-primary" />,
  };

  const bgColors: any = {
    warning: "bg-amber-50/50 border-amber-100",
    destructive: "bg-rose-50/50 border-rose-100",
    info: "bg-primary/5 border-primary/10",
  };

  return (
    <div className={cn("flex gap-4 p-4 rounded-xl border", bgColors[type])}>
      <div className="flex-shrink-0 mt-1">{icons[type]}</div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <p className="font-bold text-slate-900 text-sm">{title}</p>
          <span className="text-[10px] text-slate-400 font-medium font-mono">{time}</span>
        </div>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function UsageBar({ label, value }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}
