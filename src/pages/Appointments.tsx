import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, Plus } from "lucide-react";
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
import { toast } from "@/components/ui/sonner";
import { format, parseISO } from "date-fns";

type Patient = { id: string; full_name: string; };
type Doctor = { id: string; name: string; specialization: string; };
type Appointment = {
  id: string;
  appointment_time: string; // Single timestamp field
  status: string;
  notes: string;
  patients: { full_name: string } | null;
  doctors: { name: string; specialization: string } | null;
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ patient_id: "", doctor_id: "", appointment_time: "", notes: "" });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [apptRes, patientRes, doctorRes] = await Promise.all([
        supabase.from('appointments').select(`*, patients(full_name), doctors(name, specialization)`),
        supabase.from('patients').select('id, full_name'),
        supabase.from('doctors').select('id, name, specialization') // Note: uses 'name' from schema
      ]);
      if (apptRes.error || patientRes.error || doctorRes.error) toast.error("Failed to load page data.");
      else {
        setAppointments(apptRes.data as Appointment[]);
        setPatients(patientRes.data as Patient[]);
        setDoctors(doctorRes.data as Doctor[]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);
  
  const handleAddAppointment = async () => {
    if (!newAppointment.patient_id || !newAppointment.doctor_id || !newAppointment.appointment_time) return toast.error("All fields are required.");
    const { data, error } = await supabase.from('appointments').insert(newAppointment).select(`*, patients(full_name), doctors(name, specialization)`).single();
    if (error) toast.error("Failed to book appointment.", { description: error.message });
    else {
      setAppointments(prev => [data as Appointment, ...prev].sort((a,b) => b.appointment_time.localeCompare(a.appointment_time)));
      toast.success("Appointment booked!");
      setIsAddOpen(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => 
    selectedDate && format(parseISO(apt.appointment_time), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  ).sort((a,b) => a.appointment_time.localeCompare(b.appointment_time));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Appointment Management</h1><p className="text-muted-foreground">Manage schedules.</p></div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New Appointment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-1.5"><Label>Patient</Label><Select onValueChange={v => setNewAppointment({...newAppointment, patient_id: v})}><SelectTrigger><SelectValue placeholder="Select patient..." /></SelectTrigger><SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-1.5"><Label>Doctor</Label><Select onValueChange={v => setNewAppointment({...newAppointment, doctor_id: v})}><SelectTrigger><SelectValue placeholder="Select doctor..." /></SelectTrigger><SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.specialization})</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-1.5"><Label>Date & Time</Label><Input type="datetime-local" onChange={e => setNewAppointment({...newAppointment, appointment_time: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Notes</Label><Textarea placeholder="Reason for visit..." onChange={e => setNewAppointment({...newAppointment, notes: e.target.value})} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button onClick={handleAddAppointment}>Book Appointment</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1"><CardContent className="p-4"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} /></CardContent></Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Schedule for {selectedDate ? format(selectedDate, "PPP") : "..."}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? <p>Loading...</p> : filteredAppointments.length === 0 ? <p className="text-muted-foreground text-center py-4">No appointments for this date.</p> : filteredAppointments.map(apt => (
                <div key={apt.id} className="flex justify-between items-center p-3 rounded-lg border">
                  <div><p className="font-bold">{format(parseISO(apt.appointment_time), 'p')}</p><p>{apt.patients?.full_name ?? 'N/A'}</p><p className="text-sm text-muted-foreground">{apt.doctors?.name ?? 'N/A'}</p></div>
                  <Badge>{apt.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}