import React from 'react';
import { 
  Clock, 
  Users, 
  Activity, 
  AlertCircle, 
  ArrowRight,
  Maximize2,
  Volume2,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getQueue, getIoTData } from '@/lib/api';

export function LiveMonitorScreen() {
  const [loading, setLoading] = React.useState(true);
  const [queue, setQueue] = React.useState<any[]>([]);
  const [iotData, setIotData] = React.useState<any[]>([]);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    async function fetchData() {
      try {
        const [queueData, iot] = await Promise.all([
          getQueue(),
          getIoTData()
        ]);
        setQueue(queueData || []);
        setIotData(iot || []);
      } catch (err) {
        console.error("Monitor fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const poll = setInterval(fetchData, 10000); // Poll every 10s for live feel

    return () => {
      clearInterval(timer);
      clearInterval(poll);
    };
  }, []);

  // Derived Monitor Data
  const departments = React.useMemo(() => {
    const deptNames = Array.from(new Set(queue.map(q => q.department || 'General')));
    return deptNames.map(name => {
      const deptQueue = queue.filter(q => q.department === name);
      const current = deptQueue.find(q => q.status === 'IN_CONSULTATION') || deptQueue.find(q => q.status === 'WAITING');
      const next = deptQueue.filter(q => q.status === 'WAITING').slice(1, 2)[0];
      const waiting = deptQueue.filter(q => q.status === 'WAITING').length;
      
      const load = waiting > 15 ? 'CRITICAL' : waiting > 10 ? 'BUSY' : 'NORMAL';
      
      return {
        name,
        current: current?.token_number || '--',
        next: next?.token_number || '--',
        waiting,
        status: load
      };
    }).sort((a, b) => b.waiting - a.waiting);
  }, [queue]);

  const stats = React.useMemo(() => {
    const waiting = queue.filter(q => q.status === 'WAITING').length;
    const avgWait = queue.length > 0 ? Math.round(queue.reduce((acc, q) => acc + (q.wait_time || 0), 0) / queue.length) : 0;
    const totalCapacity = 100; // Mock Max capacity
    const load = Math.round((queue.length / totalCapacity) * 100);

    return {
      waiting,
      avgWait,
      load: Math.min(100, load)
    };
  }, [queue]);

  if (loading && queue.length === 0) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 text-white p-6 flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-black text-2xl">Q</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">InclusyQ Live Operations</h1>
            <p className="text-slate-400 text-sm font-medium">
              City General Hospital • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <LiveStat label="Total Waiting" value={stats.waiting.toString()} icon={Users} color="text-primary" />
          <LiveStat label="Avg Wait Time" value={`${stats.avgWait}m`} icon={Clock} color="text-warning" />
          <LiveStat label="Facility Load" value={`${stats.load}%`} icon={Activity} color="text-success" />
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Maximize2 className="w-6 h-6 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar">
        {departments.length > 0 ? (
          departments.map((dept) => (
            <MonitorCard key={dept.name} {...dept} />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center text-slate-500 py-20">
            <Activity className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xl font-bold">No Active Queues Detected</p>
            <p className="text-sm">Wait list will appear here once tokens are generated.</p>
          </div>
        )}
      </div>

      {/* Footer / Announcement Bar */}
      <div className="h-20 bg-primary/10 border border-primary/20 rounded-2xl flex items-center px-8 gap-6 overflow-hidden">
        <div className="flex items-center gap-3 text-primary flex-shrink-0">
          <Volume2 className="w-8 h-8 animate-pulse" />
          <span className="font-black text-xl uppercase tracking-widest">Announcement:</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-xl font-medium text-slate-200 whitespace-nowrap animate-marquee">
            {queue.length > 0 
              ? queue.filter(q => q.status === 'IN_CONSULTATION').slice(0, 3).map(q => `Token ${q.token_number} please proceed to ${q.department} Room ${q.room_number || '1'} • `).join("")
              : "Welcome to City General Hospital. Please register at the reception to receive your smart token."
            }
          </p>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

function LiveStat({ label, value, icon: Icon, color }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-lg bg-white/5", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
    </div>
  );
}

function MonitorCard({ name, current, next, waiting, status }: any) {
  const statusConfig: any = {
    NORMAL: { color: 'bg-emerald-500', label: 'Normal' },
    BUSY: { color: 'bg-amber-500', label: 'Busy' },
    DELAYED: { color: 'bg-rose-500', label: 'Delayed' },
    CRITICAL: { color: 'bg-rose-600 animate-pulse', label: 'Critical' },
  };

  const config = statusConfig[status] || statusConfig.NORMAL;

  return (
    <Card className="bg-white/5 border-white/10 overflow-hidden flex flex-col shadow-2xl">
      <div className={cn("h-1.5 w-full", config.color)} />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-white text-lg font-bold truncate max-w-[70%]">{name}</CardTitle>
          <Badge variant="outline" className={cn("text-[10px] border-none text-white", config.color)}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between py-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Now Serving</p>
          <h3 className="text-7xl font-black text-primary tracking-tighter">{current}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Next</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-slate-200">{next}</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </div>
          </div>
          <div className="text-center border-l border-white/10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Waiting</p>
            <span className="text-2xl font-bold text-slate-200">{waiting}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
