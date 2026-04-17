import React from 'react';
import {
  Clock,
  MapPin,
  Calendar,
  User,
  Accessibility,
  Smartphone,
  Info,
  CalendarDays,
  XCircle,
  RefreshCw,
  Loader2,
  Plus,
  CheckCircle,
  Hourglass,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  getPatientActiveAppointment,
  getPatientHistory,
  bookAppointment,
  cancelAppointment,
  subscribeToAppointments,
  getHospitalsList,
  type Appointment,
  type Hospital,
} from '@/lib/appointments';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  0: { label: 'Waiting', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Hourglass },
  1: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  2: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  3: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
} as const;

// ─── Main Component ───────────────────────────────────────────────────────────
export function PatientDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [booking, setBooking] = React.useState(false);
  const [appointment, setAppointment] = React.useState<Appointment | null>(null);
  const [history, setHistory] = React.useState<Appointment[]>([]);
  const [offset, setOffset] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [cancelingId, setCancelingId] = React.useState<string | null>(null);
  const [hospitals, setHospitals] = React.useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = React.useState('');
  const [selectedTime, setSelectedTime] = React.useState('');
  const [showBookForm, setShowBookForm] = React.useState(false);
  const [ahead, setAhead] = React.useState(0);

  // Read patient ID from session — empty string if not logged in
  const patientId = localStorage.getItem('user_id') ?? '';

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAppointment = React.useCallback(async () => {
    try {
      const [data, hist] = await Promise.all([
        getPatientActiveAppointment(patientId),
        getPatientHistory(patientId, 10, 0)
      ]);
      
      if (data) {
        console.log('--- Debug: Patient Fetch Pipeline ---');
        console.log('Active Appointment:', data);
        console.log('History Offset 0:', hist);
        console.log('-----------------------------------');
      }

      setAppointment(data);
      setAhead(data ? Math.max(0, data.token_number - 1) : 0);
      setHistory(hist);
      setOffset(0);
      setHasMore(hist.length === 10);
    } catch (err) {
      console.error('Patient fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const loadMoreHistory = async () => {
    setLoadingMore(true);
    try {
      const newOffset = offset + 10;
      const hist = await getPatientHistory(patientId, 10, newOffset);
      setHistory(prev => [...prev, ...hist]);
      setOffset(newOffset);
      setHasMore(hist.length === 10);
    } catch (err) {
      console.error('Patient fetch more history error:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  React.useEffect(() => {
    fetchAppointment();
    // Load hospitals from the correct endpoint with safe error handling
    getHospitalsList().then((h) => {
      setHospitals(h);
      // Auto-select the first hospital so the dropdown starts with a valid UUID
      if (h.length > 0) setSelectedHospital(h[0].id);
    });
  }, [fetchAppointment]);

  // ── Realtime ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    // Only subscribe when we have a real hospital ID
    const hospitalId = appointment?.hospital_id || selectedHospital;
    if (!hospitalId) return;
    const unsub = subscribeToAppointments(hospitalId, fetchAppointment);
    return unsub;
  }, [appointment?.hospital_id, selectedHospital, fetchAppointment]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();

    // Explicit validation with actionable error messages
    if (!patientId) {
      toast.error('You must be logged in to book an appointment');
      return;
    }
    if (!selectedHospital) {
      toast.error('Please select a hospital');
      return;
    }
    if (!selectedTime) {
      toast.error('Please select an appointment time');
      return;
    }

    setBooking(true);
    try {
      const userRoleStr = localStorage.getItem('user_role');
      const userRole = userRoleStr || "0";
      
      const appt = await bookAppointment({
        patient_id: patientId,
        hospital_id: selectedHospital,
        appointment_time: new Date(selectedTime).toISOString(),
        user_role: userRole,
      });
      await fetchAppointment();
      setShowBookForm(false);
      setSelectedTime('');
      toast.success(`Token #${appt.token_number} booked! ETA: ~${appt.estimated_minutes} min`);
    } catch (err: any) {
      console.error('Booking error:', err);
      toast.error(err.message || 'Booking failed — check console for details');
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;
    try {
      await cancelAppointment(appointment.id, appointment.hospital_id);
      await fetchAppointment();
      toast.success('Appointment cancelled');
    } catch (err: any) {
      toast.error(err.message || 'Cancel failed');
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Fetching your token status...</p>
      </div>
    );
  }

  const status = appointment ? STATUS_MAP[appointment.status] : null;
  const progressPct = appointment ? Math.max(10, 100 - (ahead * 10)) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hello! 👋</h1>
          <p className="text-slate-500">
            {appointment
              ? (hospitals.find((h) => h.id === appointment.hospital_id)?.name ?? 'InclusyQ')
              : 'InclusyQ Patient Portal'}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
          <Accessibility className="w-6 h-6 text-primary" />
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white border border-slate-100 shadow-sm p-1 rounded-xl h-auto">
          <TabsTrigger value="active" className="rounded-lg py-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Active Token</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-8 mt-0 outline-none">
          {/* Active Token Card */}
          {appointment && status ? (
        <>
          <Card className="border-primary/20 shadow-2xl shadow-primary/10 overflow-hidden">
            <div className="bg-primary p-6 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">
                    Your Token
                  </p>
                  <h2 className="text-7xl font-black leading-none">{appointment.token_number}</h2>
                </div>
                <Badge className={cn('border px-3 py-1 font-semibold text-sm', status.color)}>
                  <status.icon className="w-3.5 h-3.5 mr-1 inline-block" />
                  {status.label}
                </Badge>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex justify-between text-sm font-medium">
                  <span>Queue Progress</span>
                  <span>{ahead} patients ahead</span>
                </div>
                <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-2xl font-bold">
                      ~{appointment.estimated_minutes} min
                    </span>
                  </div>
                  <p className="text-sm text-primary-foreground/80 uppercase tracking-widest font-bold">
                    Est. Wait
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoBox
                  icon={Calendar}
                  label="Appointment Time"
                  value={new Date(appointment.appointment_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                />
                <InfoBox
                  icon={MapPin}
                  label="Hospital"
                  value={hospitals.find((h) => h.id === appointment.hospital_id)?.name ?? appointment.hospital_id.slice(0, 8) + '…'}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl gap-2"
                  onClick={() => { setLoading(true); fetchAppointment(); }}
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl gap-2 border-rose-100 text-rose-600 hover:bg-rose-50"
                  onClick={handleCancel}
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Smart Token banner */}
          <Card className="bg-slate-900 text-white border-none overflow-hidden shadow-lg">
            <CardContent className="p-5 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold">Smart Token Active</h4>
                <p className="text-sm text-slate-400">
                  Live-synced — you'll be notified 5 min before your turn.
                </p>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* No Active Token */
        <Card className="p-12 text-center flex flex-col items-center gap-5 bg-slate-50 border-dashed border-2">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm">
            <CalendarDays className="w-10 h-10 text-slate-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">No Active Token</h3>
            <p className="text-slate-500 mt-1 max-w-sm">
              You don't have an active appointment. Book one below to join the queue.
            </p>
          </div>
          <Button
            className="mt-2 px-8 h-12 rounded-full gap-2"
            onClick={() => setShowBookForm(true)}
          >
            <Plus className="w-4 h-4" />
            Book Appointment
          </Button>
        </Card>
      )}

      {/* Book Appointment Form */}
      {showBookForm && (
        <Card className="overflow-hidden shadow-xl">
          <CardHeader>
            <CardTitle>Book an Appointment</CardTitle>
            <CardDescription>Select a hospital and time slot to join the queue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBook} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Hospital</label>
                {hospitals.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    No hospitals found. Please ensure the hospitals table exists in Supabase.
                  </p>
                ) : (
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={selectedHospital}
                    onChange={(e) => setSelectedHospital(e.target.value)}
                    required
                  >
                    <option value="">Select a hospital…</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Appointment Time</label>
                <input
                  type="datetime-local"
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 h-11 gap-2" disabled={booking}>
                  {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {booking ? 'Booking...' : 'Confirm Booking'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setShowBookForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Guidance */}
      {!showBookForm && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">What to do next?</h3>
          <div className="space-y-3">
            <GuidanceItem
              icon={Info}
              title="Stay in the Lobby"
              description="Remain within the facility. Your smart token will alert you 5 minutes before your turn."
            />
            <GuidanceItem
              icon={MapPin}
              title="Find Your Room"
              description="Consultation rooms are labeled on the Floor Map available at every entrance."
            />
            <GuidanceItem
              icon={CalendarDays}
              title="Digital Prescription"
              description="Your doctor will upload your prescription directly to this dashboard after the visit."
            />
          </div>
        </div>
      )}
      </TabsContent>

      <TabsContent value="history" className="space-y-4 outline-none">
        {history.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center gap-4 bg-slate-50 border-dashed border-2">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm">
              <CalendarDays className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No appointments found.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((app) => {
              const stat = STATUS_MAP[app.status];
              return (
                <Card key={app.id} className="p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow border-slate-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {new Date(app.appointment_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        {' • '}
                        {new Date(app.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {hospitals.find((h) => h.id === app.hospital_id)?.name ?? 'Hospital'}
                      </p>
                    </div>
                    <Badge className={cn('border px-2.5 py-1 text-xs shadow-sm whitespace-nowrap', stat.color)}>
                      <stat.icon className="w-3.5 h-3.5 mr-1.5 inline-block" />
                      {stat.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">Token #{app.token_number}</span>
                    {app.status === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium px-4"
                        onClick={async () => {
                          try {
                            setCancelingId(app.id);
                            await cancelAppointment(app.id, app.hospital_id);
                            await fetchAppointment();
                            toast.success('Appointment cancelled');
                          } catch (err: any) {
                            toast.error(err.message || 'Failed to cancel');
                          } finally {
                            setCancelingId(null);
                          }
                        }}
                        disabled={cancelingId === app.id}
                      >
                        {cancelingId === app.id ? <Loader2 className="w-4 h-4 animate-spin mr-1 text-rose-500" /> : null}
                        Cancel Token
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
            
            {hasMore && history.length >= 10 && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMoreHistory} 
                  disabled={loadingMore}
                  className="rounded-full shadow-sm text-slate-600 px-6 gap-2"
                >
                  {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loadingMore ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoBox({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function GuidanceItem({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <div>
        <p className="font-bold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
