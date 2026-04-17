import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
  PlayCircle
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
import { getPatients } from '@/lib/api';
import { getHospitalsList, type Hospital } from '@/lib/appointments';
import { useQueueTokens } from '@/hooks/useQueueTokens';
import { createToken, callNextToken } from '@/lib/queue-tokens';
import { toast } from 'sonner';

// Read hospital from session
function getSessionHospitalId(): string {
  return localStorage.getItem('hospital_id') || '';
}

export function ReceptionDashboard() {
  const navigate = useNavigate();
  const hospitalId = getSessionHospitalId();
  
  const { queue, loading, refreshQueue } = useQueueTokens(hospitalId);
  
  const [patients, setPatients] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showBooking, setShowBooking] = React.useState(false);
  const [bookingForm, setBookingForm] = React.useState({ patient_id: '' });
  const [isBooking, setIsBooking] = React.useState(false);
  const [isCalling, setIsCalling] = React.useState(false);

  React.useEffect(() => {
  if (showBooking) {
    getPatients().then((p) => setPatients(p || []));
  }
}, [showBooking]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patient_id || !hospitalId) {
      toast.error('Please select a patient / valid session');
      return;
    }
    setIsBooking(true);
    try {
      const token = await createToken(hospitalId, bookingForm.patient_id);
      toast.success(`Token #${token.token_number} issued successfully!`);
      setShowBooking(false);
      setBookingForm({ patient_id: '' });
      refreshQueue();
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Token generation failed');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCallNext = async () => {
    setIsCalling(true);
    try {
      await callNextToken(hospitalId);
      toast.success('Called next token successfully');
      refreshQueue();
    } catch (err: any) {
      console.error('Call next error:', err);
      toast.error(err.message || 'Failed to call next token');
    } finally {
      setIsCalling(false);
    }
  };

  const filteredQueue = React.useMemo(() => {
    return queue.filter((q) =>
      String(q.token_number).includes(searchTerm) ||
      q.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.patients?.phone?.includes(searchTerm)
    );
  }, [queue, searchTerm]);

  const stats = React.useMemo(() => {
    return {
      waiting: queue.filter(q => q.status === 0).length,
      active: queue.filter(q => q.status === 1).length,
    };
  }, [queue]);

  const currentToken = queue.find(q => q.status === 1);
  const nextWaitingTokens = queue.filter(q => q.status === 0).sort((a,b) => a.token_number - b.token_number).slice(0, 2);

  // Debug Logging
  React.useEffect(() => {
    console.log("Reception Dashboard State:", {
      hospitalId,
      queueLength: queue.length,
      loading,
      currentToken: currentToken?.token_number
    });
  }, [hospitalId, queue, loading, currentToken]);

  // 1. Session Validation
  if (!hospitalId) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">No Hospital Session Found</h3>
          <p className="text-slate-500 mt-2 max-w-sm">
            Your login session is missing the required facility ID. Please log in again to access the dashboard.
          </p>
        </div>
        <Button onClick={() => navigate('/login')} className="gap-2">
          Return to Login
        </Button>
      </div>
    );
  }

  // 2. Loading State
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Synchronizing live queue data...</p>
      </div>
    );
  }

  // 3. Empty State (Only if not loading)
  if (!loading && queue.length === 0 && !searchTerm) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Front Desk & Queue Link</h1>
            <p className="text-slate-500">Live ESP32 integration dashboard</p>
          </div>
          <Button className="gap-2 h-11 px-6 rounded-full shadow-lg" onClick={() => setShowBooking(true)}>
            <UserPlus className="w-5 h-5" />
            New Registration
          </Button>
        </div>

        <Card className="p-20 text-center flex flex-col items-center gap-5 bg-slate-50 border-dashed border-2">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm">
            <Ticket className="w-10 h-10 text-slate-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Queue is Currently Empty</h3>
            <p className="text-slate-500 mt-1 max-w-sm">
              There are no active or waiting tokens for this hospital today. Start by registering a patient.
            </p>
          </div>
          <Button
            className="mt-2 px-8 h-12 rounded-full gap-2"
            onClick={() => setShowBooking(true)}
          >
            <Plus className="w-4 h-4" />
            Issue First Token
          </Button>
        </Card>

        {/* Re-render booking modal in empty state to allow interaction */}
        {showBooking && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Register Patient</CardTitle>
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
                      onChange={(e) => setBookingForm({ patient_id: e.target.value })}
                      required
                    >
                      <option value="">Select a patient...</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1 h-11 gap-2" disabled={isBooking}>
                      {isBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      {isBooking ? 'Registering...' : 'Issue Token'}
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
              <CardTitle>Register Patient</CardTitle>
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
                    onChange={(e) => setBookingForm({ patient_id: e.target.value })}
                    required
                  >
                    <option value="">Select a patient...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 h-11 gap-2" disabled={isBooking}>
                    {isBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {isBooking ? 'Registering...' : 'Issue Token'}
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

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Front Desk & Queue Link</h1>
          <p className="text-slate-500">Live ESP32 integration dashboard using queue_tokens</p>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2 h-11 px-6 rounded-full shadow-lg shadow-primary/20" onClick={() => setShowBooking(true)}>
            <UserPlus className="w-5 h-5" />
            New Registration
          </Button>
        </div>
      </div>

      {/* Top Cards: Search & Current Status */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col h-full justify-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Search patient or token..." 
                  className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20 lg:col-span-2">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 font-bold mb-1">Currently Serving</p>
              {currentToken ? (
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-black">{currentToken.token_number}</div>
                  <div className="border-l border-white/20 pl-4">
                    <p className="font-bold text-lg">{currentToken.patients?.name || 'Unknown Patient'}</p>
                    <Badge className="bg-white/20 hover:bg-white/30 border-none text-white mt-1">Status: Active</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-3xl font-medium text-white/70">No Active Tokens</div>
              )}
            </div>
            
            <div>
              <Button 
                onClick={handleCallNext} 
                disabled={isCalling}
                className="bg-white text-primary hover:bg-slate-10 font-bold h-14 px-6 text-lg rounded-xl shadow-lg"
              >
                {isCalling ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <PlayCircle className="w-6 h-6 mr-2" />}
                Call Next Token
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Waiting Queue</CardTitle>
              <CardDescription>All tokens recorded in the database ({filteredQueue.length} total shown)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20">{stats.waiting} Waiting</Badge>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{stats.active} Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQueue.length > 0 ? filteredQueue.map((q) => (
                  <TableRow key={q.id} className={cn(q.status === 1 && "bg-primary/5")}>
                    <TableCell>
                      <span className={cn("font-black text-lg", q.status === 1 ? "text-primary" : "text-slate-700")}>
                        {q.token_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                          {q.patients?.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{q.patients?.name || 'Unknown Patient'}</p>
                          <p className="text-xs text-slate-500">{q.patients?.phone || '--'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <QueueStatusBadge status={q.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Check-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Print Slip">
                          <Printer className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                      No matching queue tokens found.
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
              <CardTitle>ESP32 Device Next Up</CardTitle>
              <CardDescription>Live sync targeting pending tokens</CardDescription>
            </CardHeader>
            <CardContent>
              {nextWaitingTokens.length > 0 ? (
                <div className="space-y-3">
                  {nextWaitingTokens.map((nextT, i) => (
                    <div key={nextT.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 text-slate-600 font-bold">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">Token {nextT.token_number}</p>
                          <p className="text-xs text-slate-500">{nextT.patients?.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed rounded-xl border-slate-200 bg-slate-50">
                  <Ticket className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-medium text-slate-600">No tokens waiting</p>
                  <p className="text-xs text-slate-400 mt-1">Register patients to fill the queue</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <CardTitle className="text-sm">Polling Active</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tokens are fetched every 3 seconds to avoid Supabase Realtime limits while ensuring ESP32 device sync readiness.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QueueStatusBadge({ status }: { status: number }) {
  const map: Record<number, { label: string; className: string }> = {
    0: { label: 'Waiting', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    1: { label: 'In Service', className: 'bg-primary/10 text-primary border-primary/20' },
    2: { label: 'Completed', className: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
    3: { label: 'Cancelled', className: 'bg-rose-100 text-rose-600 border-rose-200' },
  };
  
  const { label, className } = map[status] || map[0];
  
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", className)}>
      {label}
    </Badge>
  );
}
