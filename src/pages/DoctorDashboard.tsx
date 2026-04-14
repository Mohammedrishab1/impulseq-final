import React from 'react';
import {
  User,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  History,
  MessageSquare,
  Loader2,
  RefreshCw,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  getAppointments,
  updateStatus,
  subscribeToAppointments,
  updatePatientMedicalPriority,
  type Appointment,
} from '@/lib/appointments';
import { toast } from 'sonner';

function getSessionHospitalId(): string {
  return localStorage.getItem('hospital_id') || '';
}

const STATUS_LABELS: Record<number, string> = {
  0: 'Waiting',
  1: 'In Progress',
  2: 'Completed',
  3: 'Cancelled',
};

export function DoctorDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [queue, setQueue] = React.useState<Appointment[]>([]);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const hospitalId = getSessionHospitalId();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchQueue = React.useCallback(async () => {
    try {
      const data = await getAppointments(hospitalId || undefined);
      // Sorted already by API: priority DESC, token ASC
      setQueue(data);
    } catch (err) {
      console.error('Doctor fetch error:', err);
      toast.error('Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  React.useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // ── Realtime ───────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!hospitalId) return;
    const unsub = subscribeToAppointments(hospitalId, () => fetchQueue());
    return unsub;
  }, [hospitalId, fetchQueue]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const currentPatient = React.useMemo(() => queue.find((q) => q.status === 1), [queue]);
  const waitingQueue = React.useMemo(() => queue.filter((q) => q.status === 0), [queue]);
  const completedCount = React.useMemo(() => queue.filter((q) => q.status === 2).length, [queue]);

  const stats = React.useMemo(() => {
    const total = queue.length || 1;
    const completed = completedCount;
    return {
      seen: completed,
      total: queue.length,
      progress: Math.round((completed / total) * 100),
    };
  }, [queue, completedCount]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const markStatus = async (id: string, status: 0 | 1 | 2, label: string) => {
    setActionLoading(id);
    try {
      await updateStatus(id, status, hospitalId || undefined);
      toast.success(label);
      await fetchQueue();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddNotes = async () => {
    if (!currentPatient) return;
    const notes = prompt(`Enter consultation notes for ${currentPatient.users?.name ?? 'patient'}:`);
    if (notes === null) return;
    
    const priorityStr = prompt("Set baseline priority level (0-10) for this patient's future bookings (Higher = faster service):");
    if (priorityStr === null) return;
    const priority = parseInt(priorityStr, 10) || 0;
    
    setActionLoading(currentPatient.id);
    try {
      await updatePatientMedicalPriority(
        currentPatient.patient_id, 
        localStorage.getItem('user_id') || '', 
        priority, 
        notes
      );
      toast.success("Medical records and baseline priority updated successfully!");
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync medical records');
    } finally {
      setActionLoading(null);
    }
  };

  const callNext = async () => {
    const nextPatient = waitingQueue[0];
    if (!nextPatient) {
      toast.info('No patients waiting');
      return;
    }
    // If there's a current patient, complete them first
    if (currentPatient) {
      await markStatus(currentPatient.id, 2, 'Previous patient marked completed');
    }
    await markStatus(nextPatient.id, 1, `Now serving Token #${nextPatient.token_number}`);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading session data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Doctor Dashboard</h1>
          <p className="text-slate-500">Today's queue — {queue.length} total appointments</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={fetchQueue}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => console.log('History clicked')}>
            <History className="w-4 h-4" />
            Session History
          </Button>
          <Button variant="destructive" className="gap-2" onClick={() => toast.info('Emergency protocol initiated')}>
            <AlertCircle className="w-4 h-4" />
            Emergency
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Waiting" value={waitingQueue.length} color="text-amber-600" />
        <StatCard label="In Progress" value={currentPatient ? 1 : 0} color="text-blue-600" />
        <StatCard label="Completed" value={completedCount} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Current Patient Panel */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-primary/20 bg-primary/[0.02] overflow-hidden shadow-xl shadow-primary/5">
            <div className="h-1 bg-primary w-full" />
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <Badge className="mb-2 bg-primary text-white border-none">Currently Serving</Badge>
                <CardTitle className="text-2xl">
                  Token {currentPatient?.token_number ?? '--'}
                </CardTitle>
              </div>
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-5"
                onClick={callNext}
                disabled={!!actionLoading || waitingQueue.length === 0}
              >
                <Play className="w-4 h-4" />
                Call Next
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {currentPatient ? (
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shadow-inner">
                      {currentPatient.users?.name?.charAt(0) ?? 'P'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {currentPatient.users?.name ?? 'Unknown Patient'}
                      </h3>
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        {currentPatient.users?.email ?? 'No email provided'}
                      </p>
                      <p className="text-sm text-slate-500">
                        Token #{currentPatient.token_number} • Priority {currentPatient.priority}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                    <MiniInfo label="Appt. Time" value={new Date(currentPatient.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    <MiniInfo label="Status" value={STATUS_LABELS[currentPatient.status]} />
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center flex flex-col items-center">
                  <User className="w-16 h-16 text-slate-200 mb-2" />
                  <p className="text-slate-500 font-medium">No patient currently in consultation.</p>
                  <p className="text-sm text-slate-400">Press "Call Next" to start serving.</p>
                </div>
              )}

              {currentPatient && (
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-5"
                    disabled={!!actionLoading}
                    onClick={() => markStatus(currentPatient.id, 2, `Token #${currentPatient.token_number} completed`)}
                  >
                    {actionLoading === currentPatient.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle2 className="w-4 h-4" />}
                    Complete Consultation
                  </Button>
                  <Button variant="outline" className="gap-2 h-11 px-5" onClick={handleAddNotes} disabled={!!actionLoading}>
                    <MessageSquare className="w-4 h-4" />
                    Consultation Notes
                  </Button>
                  <Button variant="outline" className="gap-2 h-11 px-5" onClick={() => console.log('Break requested')}>
                    <Clock className="w-4 h-4" />
                    Request Break
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Patients Seen</p>
                  <h4 className="text-2xl font-bold">{stats.seen} / {stats.total}</h4>
                </div>
                <p className="text-sm font-bold text-primary">{stats.progress}%</p>
              </div>
              <Progress value={stats.progress} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Queue Sidebar */}
        <div className="space-y-4">
          <Card className="flex flex-col border-none shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Next in Queue</CardTitle>
                <CardDescription>{waitingQueue.length} patients waiting</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {waitingQueue.length > 0 ? (
                waitingQueue.map((patient, index) => (
                  <QueueRow
                    key={patient.id}
                    appt={patient}
                    isFirst={index === 0}
                    onCallNext={callNext}
                    onMarkInProgress={() => markStatus(patient.id, 1, `Now serving #${patient.token_number}`)}
                    loading={actionLoading === patient.id}
                  />
                ))
              ) : (
                <div className="py-20 text-center text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">No upcoming patients</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="text-center p-4">
      <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
      <p className={cn('text-3xl font-black mt-1', color)}>{value}</p>
    </Card>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-white rounded-xl border shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function QueueRow({
  appt, isFirst, onCallNext, onMarkInProgress, loading,
}: {
  appt: Appointment;
  isFirst: boolean;
  onCallNext: () => void;
  onMarkInProgress: () => void;
  loading: boolean;
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all',
        isFirst
          ? 'bg-primary/5 border-primary/20 ring-2 ring-primary/5 shadow-md'
          : 'hover:bg-slate-50 border-slate-100'
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-lg font-black text-slate-900">#{appt.token_number}</span>
        <Badge variant="outline" className="text-[10px] h-4 px-1">
          ~{appt.estimated_minutes}m wait
        </Badge>
      </div>
      <p className="font-bold text-slate-800 text-sm">{appt.users?.name ?? 'Unknown'}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <Badge
          variant="secondary"
          className={cn(
            'text-[10px] border-none',
            appt.priority > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
          )}
        >
          {appt.priority > 0 ? `Priority ${appt.priority}` : 'Normal'}
        </Badge>
        <span className="text-[10px] text-slate-400">
          {new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {isFirst && (
        <Button className="w-full mt-3 h-8 gap-1 shadow-sm text-xs" size="sm" onClick={onMarkInProgress} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          Serve Now
        </Button>
      )}
    </div>
  );
}
