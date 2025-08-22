import { useState, useEffect } from "react";
import { Plus, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, isValid } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// *** THIS IS THE FIX: Import the missing Table components ***
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Type Definitions ---
type Patient = { id: string; full_name: string; };
type Doctor = { id: string; name: string; specialization: string; };
type Bed = { id: string; bed_number: string; wards: { name: string } | null };
type Appointment = {
  id: string;
  appointment_time: string | null;
  status: string;
  notes: string | null;
  appointment_type: 'OPD' | 'IPD';
  patients: { full_name: string } | null;
  doctors: { name: string; specialization: string } | null;
  beds: { bed_number: string; wards: { name: string } | null } | null;
};

const initialAppointmentState = {
    patient_id: "",
    doctor_id: "",
    appointment_time: "",
    notes: "",
    appointment_type: "OPD" as 'OPD' | 'IPD',
    bed_id: null as string | null,
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState(initialAppointmentState);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [apptRes, patientRes, doctorRes, bedRes] = await Promise.all([
          supabase.from('appointments').select(`*, patients(full_name), doctors(name, specialization), beds(*, wards(name))`),
          supabase.from('patients').select('id, full_name').order('full_name'),
          supabase.from('doctors').select('id, name, specialization').order('name'),
          supabase.from('beds').select('*, wards(name)').eq('is_occupied', false)
        ]);

        if (apptRes.error) throw apptRes.error;
        setAppointments(apptRes.data || []);
        if (patientRes.error) throw patientRes.error;
        setPatients(patientRes.data || []);
        if (doctorRes.error) throw doctorRes.error;
        setDoctors(doctorRes.data || []);
        if (bedRes.error) throw bedRes.error;
        setBeds(bedRes.data || []);

      } catch (error: any) {
        toast.error("Failed to load page data.", { description: error.message });
        console.error("Appointment page loading error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const handleAddAppointment = async () => {
    if (!newAppointment.patient_id || !newAppointment.doctor_id || !newAppointment.appointment_time) {
      return toast.error("Patient, Doctor, and Date/Time are required.");
    }
    if (newAppointment.appointment_type === 'IPD' && !newAppointment.bed_id) {
        return toast.error("An available bed must be selected for IPD admission.");
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert(newAppointment)
      .select(`*, patients(full_name), doctors(name, specialization), beds(*, wards(name))`)
      .single();

    if (error) {
      toast.error("Failed to book appointment.", { description: error.message });
    } else {
      if (newAppointment.appointment_type === 'IPD' && newAppointment.bed_id) {
        await supabase.from('beds').update({ is_occupied: true }).eq('id', newAppointment.bed_id);
      }
      setAppointments(prev => [...prev, data].sort((a,b) => (b.appointment_time || "").localeCompare(a.appointment_time || "")));
      toast.success(`New ${newAppointment.appointment_type} entry created!`);
      setIsAddOpen(false);
      setNewAppointment(initialAppointmentState);
    }
  };

  const opdAppointments = appointments.filter(apt => {
    if (apt.appointment_type !== 'OPD' || !apt.appointment_time || !selectedDate) return false;
    const appointmentDate = parseISO(apt.appointment_time);
    return isValid(appointmentDate) && format(appointmentDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  }).sort((a,b) => (a.appointment_time || "").localeCompare(b.appointment_time || ""));

  const ipdAdmissions = appointments.filter(apt => apt.appointment_type === 'IPD');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Appointments & Admissions</h1>
          <p className="text-sm text-muted-foreground">Manage OPD schedules and IPD patient admissions.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> New Entry</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Entry</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <RadioGroup defaultValue="OPD" className="grid grid-cols-2 gap-4" onValueChange={(v: 'OPD' | 'IPD') => setNewAppointment({...newAppointment, appointment_type: v})}>
                <div><RadioGroupItem value="OPD" id="opd" className="peer sr-only" /><Label htmlFor="opd" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">OPD Appointment</Label></div>
                <div><RadioGroupItem value="IPD" id="ipd" className="peer sr-only" /><Label htmlFor="ipd" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">IPD Admission</Label></div>
              </RadioGroup>
              <div className="grid gap-1.5"><Label>Patient</Label><Select onValueChange={v => setNewAppointment({...newAppointment, patient_id: v})}><SelectTrigger><SelectValue placeholder="Select a patient..." /></SelectTrigger><SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-1.5"><Label>Doctor</Label><Select onValueChange={v => setNewAppointment({...newAppointment, doctor_id: v})}><SelectTrigger><SelectValue placeholder="Select a doctor..." /></SelectTrigger><SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.specialization})</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-1.5"><Label>{newAppointment.appointment_type === 'OPD' ? 'Appointment Date & Time' : 'Admission Date & Time'}</Label><Input type="datetime-local" onChange={e => setNewAppointment({...newAppointment, appointment_time: e.target.value})} /></div>
              {newAppointment.appointment_type === 'IPD' && (
                <div className="grid gap-1.5"><Label>Assign Bed</Label><Select onValueChange={v => setNewAppointment({...newAppointment, bed_id: v})}><SelectTrigger><SelectValue placeholder="Select an available bed..." /></SelectTrigger><SelectContent>{beds.map(b => <SelectItem key={b.id} value={b.id}>{b.wards?.name} - {b.bed_number}</SelectItem>)}</SelectContent></Select></div>
              )}
              <div className="grid gap-1.5"><Label>Notes</Label><Textarea placeholder="Reason for visit or admission notes..." onChange={e => setNewAppointment({...newAppointment, notes: e.target.value})} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button onClick={handleAddAppointment}>Save Entry</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="opd">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="opd">OPD Schedule</TabsTrigger>
          <TabsTrigger value="ipd">IPD Admissions</TabsTrigger>
        </TabsList>
        <TabsContent value="opd">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            <Card className="lg:col-span-1"><CardContent className="p-0 sm:p-2"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="w-full" /></CardContent></Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>OPD Schedule for {selectedDate ? format(selectedDate, "PPP") : "..."}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading && <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>}
                  {!loading && opdAppointments.length === 0 && <div className="text-center text-muted-foreground py-8"><p>No OPD appointments for this date.</p></div>}
                  {!loading && opdAppointments.map(apt => (
                    <div key={apt.id} className="flex justify-between items-center p-4 rounded-lg border bg-card">
                      <div>
                        <p className="font-bold text-primary">{apt.appointment_time ? format(parseISO(apt.appointment_time), 'p') : 'No Time'}</p>
                        <p className="font-semibold">{apt.patients?.full_name ?? 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">Dr. {apt.doctors?.name ?? 'N/A'}</p>
                      </div>
                      <Badge variant="secondary">{apt.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="ipd">
            <Card className="mt-4">
                <CardHeader><CardTitle>Current In-Patients (IPD)</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Admission Date</TableHead>
                                    <TableHead>Assigned Bed</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>}
                                {!loading && ipdAdmissions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8">No patients currently admitted.</TableCell></TableRow>}
                                {!loading && ipdAdmissions.map(apt => (
                                    <TableRow key={apt.id}>
                                        <TableCell className="font-medium">{apt.patients?.full_name ?? 'N/A'}</TableCell>
                                        <TableCell>{apt.appointment_time ? format(parseISO(apt.appointment_time), 'PPP p') : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="flex items-center w-fit">
                                                <BedDouble className="mr-2 h-4 w-4"/>
                                                {apt.beds?.wards?.name} - {apt.beds?.bed_number}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>Dr. {apt.doctors?.name ?? 'N/A'}</TableCell>
                                        <TableCell><Badge>{apt.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
