import React from 'react';
import {
  Calendar,
  Clock,
  Users,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Loader2,
  Search,
  Activity,
  CheckCircle2,
  Hourglass,
  Play,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  getAppointments,
  updatePriority,
  updateStatus,
  subscribeToAppointments,
  type Appointment,
} from '@/lib/appointments';
import { toast } from 'sonner';

function getSessionHospitalId(): string {
  return localStorage.getItem('hospital_id') || '';
}

const STATUS_STYLES: Record<number, { label: string; cls: string }> = {
  0: { label: 'Waiting', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  1: { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  2: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  3: { label: 'Cancelled', cls: 'bg-slate-50 text-slate-500 border-slate-200' },
};

export function AdminQueueDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [search, setSearch] = React.useState('');
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const hospitalId = getSessionHospitalId();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const isFetching = React.useRef(false);

  const fetchData = React.useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const data = await getAppointments(hospitalId || undefined);
      setAppointments(data);
    } catch (err: any) {
      console.error('Admin queue fetch error:', err);
      toast.error(err.message || 'Failed to load schedule');
      return; // Stop execution on error
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  }, [hospitalId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Realtime ───────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!hospitalId) return;
    const unsub = subscribeToAppointments(hospitalId, () => fetchData());
    return unsub;
  }, [hospitalId, fetchData]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return appointments || [];
    return (appointments || []).filter(
      (a) =>
        a.users?.name?.toLowerCase().includes(term) ||
        a.users?.email?.toLowerCase().includes(term) ||
        String(a.token_number).includes(term)
    );
  }, [appointments, search]);

  const stats = React.useMemo(() => ({
    waiting: (appointments || []).filter((a) => a.status === 0).length,
    inProgress: (appointments || []).filter((a) => a.status === 1).length,
    completed: (appointments || []).filter((a) => a.status === 2).length,
    total: (appointments || []).length,
  }), [appointments]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const changePriority = async (appt: Appointment, delta: number) => {
    const newPriority = Math.max(0, appt.priority + delta);
    setUpdatingId(appt.id);
    try {
      await updatePriority(appt.id, newPriority, hospitalId || appt.hospital_id);
      toast.success(`Priority updated → ${newPriority}. ETAs recalculated.`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update priority');
    } finally {
      setUpdatingId(null);
    }
  };

  const changeStatus = async (appt: Appointment, status: 0 | 1 | 2) => {
    setUpdatingId(appt.id);
    try {
      await updateStatus(appt.id, status, appt.hospital_id);
      toast.success(`Token #${appt.token_number} → ${STATUS_STYLES[status].label}`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const callNext = async () => {
    const waitingQueue = (appointments || []).filter(a => a.status === 0);
    const inProgress = (appointments || []).find(a => a.status === 1);
    const nextPatient = waitingQueue[0];
    if (!nextPatient) {
      toast.info('No patients waiting');
      return;
    }
    setUpdatingId('call-next');
    try {
      if (inProgress) {
        await updateStatus(inProgress.id, 2, inProgress.hospital_id);
      }
      await updateStatus(nextPatient.id, 1, nextPatient.hospital_id);
      toast.success(`Now serving Token #${nextPatient.token_number}`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to call next patient');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading today's schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Queue Management</h1>
          <p className="text-slate-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3 self-start">
          <Button 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" 
            onClick={callNext}
            disabled={updatingId === 'call-next' || stats.waiting === 0}
          >
            {updatingId === 'call-next' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Call Next Patient
          </Button>
          <Button variant="outline" className="gap-2" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total" value={stats.total} icon={Users} color="text-slate-700" />
        <SummaryCard label="Waiting" value={stats.waiting} icon={Hourglass} color="text-amber-600" />
        <SummaryCard label="In Progress" value={stats.inProgress} icon={Activity} color="text-blue-600" />
        <SummaryCard label="Completed" value={stats.completed} icon={CheckCircle2} color="text-emerald-600" />
      </div>

      {/* Table */}
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Ordered by Priority DESC → Token ASC. Adjust priority to reorder queue.</CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or token..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold">Token</TableHead>
                    <TableHead className="font-bold">Patient</TableHead>
                    <TableHead className="font-bold">Appt. Time</TableHead>
                    <TableHead className="font-bold">Priority</TableHead>
                    <TableHead className="font-bold">Est. Wait</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(filtered || []).map((appt) => {
                    const statusStyle = STATUS_STYLES[appt.status] || { label: 'Unknown', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
                    const busy = updatingId === appt.id;
                    return (
                      <TableRow
                        key={appt.id}
                        className={cn(
                          'transition-colors',
                          appt.priority > 0 && 'bg-rose-50/30'
                        )}
                      >
                        <TableCell>
                          <span className="text-lg font-black text-slate-900">
                            #{appt.token_number}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                              {appt.users?.name?.charAt(0) ?? 'P'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-800">
                                {appt.users?.name ?? 'Unknown'}
                              </span>
                              <span className="text-xs text-slate-500">
                                {appt.users?.email ?? ''}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {new Date(appt.appointment_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                'text-sm font-bold px-2 py-0.5 rounded-md',
                                appt.priority > 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {appt.priority}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            ~{appt.estimated_minutes}m
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn('border text-xs font-semibold', statusStyle?.cls || 'bg-slate-100')}
                          >
                            {statusStyle?.label || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Priority controls */}
                            <button
                              title="Increase priority"
                              disabled={busy}
                              className="w-7 h-7 rounded-md hover:bg-rose-50 flex items-center justify-center text-slate-500 hover:text-rose-600 disabled:opacity-40 transition-colors"
                              onClick={() => changePriority(appt, 1)}
                            >
                              {busy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ChevronUp className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              title="Decrease priority"
                              disabled={busy || appt.priority <= 0}
                              className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 disabled:opacity-30 transition-colors"
                              onClick={() => changePriority(appt, -1)}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Status controls */}
                            {appt.status === 0 && (
                              <button
                                title="Mark In Progress"
                                disabled={busy}
                                className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-40"
                                onClick={() => changeStatus(appt, 1)}
                              >
                                Start
                              </button>
                            )}
                            {appt.status === 1 && (
                              <button
                                title="Mark Completed"
                                disabled={busy}
                                className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-40"
                                onClick={() => changeStatus(appt, 2)}
                              >
                                Done
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No appointments found for today</p>
              <p className="text-sm mt-1">Appointments booked through the patient or reception portal will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
        <p className={cn('text-2xl font-black', color)}>{value}</p>
      </div>
    </Card>
  );
}
