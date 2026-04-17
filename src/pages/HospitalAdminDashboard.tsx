import React from 'react';
import { 
  Users, 
  Clock, 
  Activity, 
  UserPlus, 
  UserCheck, 
  AlertCircle,
  Calendar as CalendarIcon,
  Play,
  Pause,
  Volume2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getQueue, getPatients, getPriorityQueue } from '@/lib/api';

export function HospitalAdminDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [queue, setQueue] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [priorityQueue, setPriorityQueue] = React.useState<any[]>([]);

  const isFetching = React.useRef(false);

  React.useEffect(() => {
    async function fetchData() {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        const [q, p, pq] = await Promise.all([
          getQueue(),
          getPatients(),
          getPriorityQueue()
        ]);
        setQueue(q || []);
        setPatients(p || []);
        setPriorityQueue(pq || []);
      } catch (err) {
        console.error("Hospital dashboard fetch error:", err);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    }
    fetchData();
  }, []);

  const inflowData = React.useMemo(() => {
    const hours = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'];
    const counts = hours.map(time => ({ time, patients: 0 }));
    queue.forEach(q => {
      const hour = new Date(q.created_at).getHours();
      if (hour >= 8 && hour <= 16) {
        const index = hour - 8;
        if (counts[index]) counts[index].patients++;
      }
    });
    return counts;
  }, [queue]);

  const stats = React.useMemo(() => ({
    activeQueues: new Set(queue.map(q => q.department)).size,
    avgWait: queue.length > 0 ? Math.round(queue.reduce((acc, q) => acc + (q.wait_time || 0), 0) / queue.length) : 0,
    walkins: queue.filter(q => q.type === 'WALK_IN').length || patients.length,
    missed: queue.filter(q => q.status === 'MISSED').length,
    occupancy: Math.min(100, Math.round((queue.length / 50) * 100)) // Assuming 50 capacity
  }), [queue, patients]);

  const departments = React.useMemo(() => {
    const names = Array.from(new Set(queue.map(q => q.department || 'General')));
    return names.slice(0, 4).map(name => {
      const deptQueue = queue.filter(q => q.department === name);
      const current = deptQueue.find(q => q.status === 'IN_CONSULTATION')?.token_number || '--';
      const waiting = deptQueue.filter(q => q.status === 'WAITING').length;
      return {
        name,
        current,
        waiting,
        avgWait: stats.avgWait,
        status: waiting > 10 ? 'BUSY' : 'NORMAL'
      };
    });
  }, [queue, stats.avgWait]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Syncing facility data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">City General Hospital</h1>
          <p className="text-slate-500">Live operations dashboard • Real-time Supabase sync</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Volume2 className="w-4 h-4" />
            Announcement
          </Button>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            New Queue
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Tokens" value={queue.length.toString()} icon={CalendarIcon} />
        <StatCard title="Active Queues" value={stats.activeQueues.toString()} icon={Activity} />
        <StatCard title="Avg Wait Time" value={`${stats.avgWait}m`} icon={Clock} />
        <StatCard title="Walk-ins" value={stats.walkins.toString()} icon={UserPlus} />
        <StatCard title="Priority" value={priorityQueue.length.toString()} icon={UserCheck} />
        <StatCard title="Missed" value={stats.missed.toString()} icon={AlertCircle} variant={stats.missed > 0 ? 'destructive' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map(dept => (
              <DepartmentCard key={dept.name} {...dept} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Patient Inflow</CardTitle>
              <CardDescription>Real-time patient arrivals by hour from Supabase</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {queue && queue.length > 0 ? (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={inflowData}>
                      <defs>
                        <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                      <Area type="monotone" dataKey="patients" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorPatients)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center text-slate-400">No stream data available.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary text-white border-none shadow-lg shadow-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Hospital Occupancy</CardTitle>
              <CardDescription className="text-primary-foreground/80">Current facility load</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="text-4xl font-bold">{stats.occupancy}%</h3>
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  {stats.occupancy > 90 ? 'Critical' : stats.occupancy > 70 ? 'Busy' : 'Normal'}
                </Badge>
              </div>
              <Progress value={stats.occupancy} className="h-2 bg-white/20" />
              <p className="text-xs text-primary-foreground/70">Calculated based on active tokens vs capacity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Priority Residents</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 px-2">View All</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {priorityQueue.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {item.patients?.name?.charAt(0) || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.patients?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.patients?.phone || ''}</p>
                    <p className="text-xs text-slate-500 truncate">{item.queue_tokens?.department} • Priority {item.priority || 'High'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{item.queue_tokens?.token_number}</p>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">URGENT</Badge>
                  </div>
                </div>
              ))}
              {priorityQueue.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-500">No priority patients currently</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <ActionButton icon={Play} label="Resume All" />
              <ActionButton icon={Pause} label="Pause All" />
              <ActionButton icon={Volume2} label="Broadcast" />
              <ActionButton icon={ChevronRight} label="More" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, variant = 'default' }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn(
          "p-2 rounded-lg",
          variant === 'destructive' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-medium">{title}</p>
          <h3 className="text-lg font-bold text-slate-900">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function DepartmentCard({ name, current, waiting, avgWait, status }: any) {
  const statusColors: any = {
    NORMAL: "bg-emerald-500",
    BUSY: "bg-amber-500",
    DELAYED: "bg-rose-500"
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-bold text-slate-900">{name}</h4>
          <div className={cn("w-2 h-2 rounded-full", statusColors[status])} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Current</p>
            <p className="text-xl font-black text-primary">{current}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Waiting</p>
            <p className="text-xl font-black text-slate-900">{waiting}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>Avg {avgWait}m</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2">Manage</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButton({ icon: Icon, label }: any) {
  return (
    <Button variant="outline" className="flex flex-col h-auto py-3 gap-2 text-xs font-medium border-slate-200 hover:border-primary hover:bg-primary/5">
      <Icon className="w-4 h-4" />
      {label}
    </Button>
  );
}
