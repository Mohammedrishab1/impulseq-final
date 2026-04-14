import React from 'react';
import { 
  Search, 
  UserPlus, 
  Ticket, 
  MapPin, 
  Clock, 
  MoreVertical,
  Printer,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Loader2,
  Users,
  Plus,
  X
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
import { cn } from '@/lib/utils';
import { getQueue, getPatients } from '@/lib/api';
import { bookAppointment, getAppointments, subscribeToAppointments, getHospitalsList, type Hospital } from '@/lib/appointments';
import { toast } from 'sonner';

// Read hospital from session — resolved at runtime, NOT module level
function getSessionHospitalId(): string {
  return localStorage.getItem('hospital_id') || '';
}

export function ReceptionDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [queue, setQueue] = React.useState<any[]>([]);
  const [patients, setPatients] = React.useState<any[]>([]);
  const [hospitals, setHospitals] = React.useState<Hospital[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showBooking, setShowBooking] = React.useState(false);
  const [bookingForm, setBookingForm] = React.useState({ patient_id: '', hospital_id: '', appointment_time: '', priority: 0 });
  const [booking, setBooking] = React.useState(false);

  // Resolved at render time, not module level
  const hospitalId = getSessionHospitalId();

  const fetchQueue = React.useCallback(async () => {
    try {
      const appts = await getAppointments(hospitalId || undefined);
      setQueue(appts as any[]);
    } catch {
      try {
        const q = await getQueue();
        setQueue(q || []);
      } catch (err) {
        console.error('Reception fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  React.useEffect(() => {
    fetchQueue();
    getPatients().then((p) => setPatients(p || [])).catch(() => {});
    getHospitalsList().then((h) => {
      setHospitals(h);
      // Pre-fill hospital in form if session has a hospital ID
      const sid = getSessionHospitalId();
      setBookingForm((f) => ({ ...f, hospital_id: sid || (h[0]?.id ?? '') }));
    });
  }, [fetchQueue]);

  React.useEffect(() => {
    if (!hospitalId) return;
    const unsub = subscribeToAppointments(hospitalId, () => fetchQueue());
    return unsub;
  }, [hospitalId, fetchQueue]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patient_id || !bookingForm.hospital_id || !bookingForm.appointment_time) {
      toast.error('Please fill all fields including hospital');
      return;
    }
    setBooking(true);
    try {
      const userRoleStr = localStorage.getItem('user_role');
      const userRole = userRoleStr || "2"; // Default to Reception (2) if somehow missing

      const appt = await bookAppointment({
        patient_id: bookingForm.patient_id,
        hospital_id: bookingForm.hospital_id,
        appointment_time: new Date(bookingForm.appointment_time).toISOString(),
        priority: bookingForm.priority,
        user_role: userRole,
      });
      toast.success(`Token #${appt.token_number} issued. ETA: ~${appt.estimated_minutes} min`);
      setShowBooking(false);
      setBookingForm((f) => ({ ...f, patient_id: '', appointment_time: '', priority: 0 }));
      await fetchQueue();
    } catch (err: any) {
      console.error('Reception booking error:', err);
      toast.error(err.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const filteredQueue = React.useMemo(() => {
    return queue.filter((q) =>
      // token_number is an integer — convert to string before searching
      String(q.token_number ?? '').includes(searchTerm) ||
      q.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [queue, searchTerm]);

  const stats = React.useMemo(() => ({
    waiting: queue.filter(q => q.status === 'WAITING').length,
    delayed: queue.filter(q => q.status === 'DELAYED').length,
    avgWait: queue.length > 0 ? Math.round(queue.reduce((acc, q) => acc + (q.wait_time || 0), 0) / queue.length) : 0
  }), [queue]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading reception desk...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Booking Modal Overlay */}
      {showBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Register New Patient</CardTitle>
              <button onClick={() => setShowBooking(false)} className="p-1 hover:bg-slate-100 rounded-md">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBook} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Patient</label>
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={bookingForm.patient_id}
                    onChange={(e) => setBookingForm((f) => ({ ...f, patient_id: e.target.value }))}
                    required
                  >
                    <option value="">Select a patient...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Hospital</label>
                  <select
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={bookingForm.hospital_id}
                    onChange={(e) => setBookingForm((f) => ({ ...f, hospital_id: e.target.value }))}
                    required
                  >
                    <option value="">Select a hospital...</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Appointment Time</label>
                  <input
                    type="datetime-local"
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={bookingForm.appointment_time}
                    onChange={(e) => setBookingForm((f) => ({ ...f, appointment_time: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Priority Level (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                    value={bookingForm.priority}
                    onChange={(e) => setBookingForm((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 h-11 gap-2" disabled={booking}>
                    {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {booking ? 'Registering...' : 'Issue Token'}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setShowBooking(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Front Desk</h1>
          <p className="text-slate-500">Patient check-in and queue assignment • Live Supabase Link</p>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2 h-11 px-6 rounded-full shadow-lg shadow-primary/20" onClick={() => setShowBooking(true)}>
            <UserPlus className="w-5 h-5" />
            New Registration
          </Button>
        </div>
      </div>

      {/* Search and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Search patient by name, phone, or token ID..." 
                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="secondary" className="h-12 px-8" onClick={() => window.location.reload()}>Refresh</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 text-white border-none">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <Smartphone className="w-8 h-8 mb-2 text-primary" />
            <h4 className="font-bold text-lg">Smart Token</h4>
            <p className="text-xs text-slate-400 mb-4">Assign physical device to non-tech users</p>
            <Button variant="secondary" size="sm" className="w-full bg-white/10 hover:bg-white/20 text-white border-none" onClick={() => console.log('Assign Device clicked')}>
              Assign Device
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Current Queue</CardTitle>
              <CardDescription>Live status of patients waiting in the lobby ({filteredQueue.length} shown)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20">{stats.waiting} Waiting</Badge>
              <Badge variant="outline" className={cn("border-rose-500/20", stats.delayed > 0 ? "bg-rose-500/5 text-rose-600" : "bg-slate-50 text-slate-400")}>
                {stats.delayed} Delayed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Est. Wait</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueue.length > 0 ? filteredQueue.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <span className="font-black text-primary text-lg">{q.token_number}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {q.users?.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{q.users?.name || 'Unknown Patient'}</p>
                          <p className="text-xs text-slate-500">{q.users?.email || ''}</p>
                          {q.type === 'EMERGENCY' && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1 uppercase">Emergency</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3" />
                        <span className="text-sm">{q.department || '--'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3" />
                        <span className="text-sm">{q.wait_time || stats.avgWait}m</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <QueueStatusBadge status={q.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Check-in" onClick={() => console.log(`Check-in token ${q.token_number}`)}>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Print Slip" onClick={() => console.log(`Print slip for ${q.token_number}`)}>
                          <Printer className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => console.log('More Options')}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                      No patients in queue matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Walk-in Assignment</CardTitle>
              <CardDescription>Quickly assign a token to a new arrival</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Patient Name</label>
                <Input placeholder="Full Name" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                <select className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  <option>Select Department</option>
                  <option>OPD - General</option>
                  <option>Pediatrics</option>
                  <option>Cardiology</option>
                  <option>Laboratory</option>
                </select>
              </div>
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <Ticket className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-medium">System Status</p>
                  <p className="text-lg font-black text-primary">{queue.length + 101} Total Tokens</p>
                </div>
                <Button size="sm">Assign</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <CardTitle className="text-sm">Priority Alert</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 leading-relaxed">
                {stats.delayed > 0 
                  ? `${stats.delayed} patients are experiencing unusual delays. Please check department status.`
                  : "All counters are operating within expected wait time limits."
                }
              </p>
              <Button variant="link" className="text-xs p-0 h-auto mt-2 text-amber-600 font-bold">Details</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QueueStatusBadge({ status }: { status: string }) {
  const variants: any = {
    WAITING: { label: 'Waiting', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    IN_CONSULTATION: { label: 'In Service', className: 'bg-primary/10 text-primary border-primary/20' },
    DELAYED: { label: 'Delayed', className: 'bg-amber-100 text-amber-600 border-amber-200' },
    COMPLETED: { label: 'Done', className: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
    MISSED: { label: 'Missed', className: 'bg-rose-100 text-rose-600 border-rose-200' },
  };
  
  const { label, className } = variants[status] || variants.WAITING;
  
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", className)}>
      {label}
    </Badge>
  );
}
