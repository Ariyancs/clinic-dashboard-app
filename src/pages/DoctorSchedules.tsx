import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, isValid } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BedDouble, User } from "lucide-react";

// --- Type Definitions ---
type Doctor = { id: string; name: string; };
type Appointment = {
  id: string;
  appointment_time: string | null;
  status: string;
  appointment_type: 'OPD' | 'IPD';
  doctor_id: string | null;
  patients: { full_name: string } | null;
  beds: { bed_number: string; wards: { name: string } | null } | null;
};

export default function DoctorSchedules() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [apptRes, doctorRes] = await Promise.all([
          supabase.from('appointments').select(`id, appointment_time, status, doctor_id, appointment_type, patients(full_name), beds(*, wards(name))`),
          supabase.from('doctors').select('id, name').order('name')
        ]);

        if (apptRes.error) throw apptRes.error;
        setAppointments(apptRes.data || []);
        
        if (doctorRes.error) throw doctorRes.error;
        setDoctors(doctorRes.data || []);

      } catch (error: any) {
        toast.error("Failed to load schedule data.", { description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter for OPD appointments on the selected date for the selected doctor
  const opdSchedule = appointments.filter(apt => {
    if (apt.appointment_type !== 'OPD' || !selectedDoctorId || !apt.appointment_time || !selectedDate) return false;
    if (apt.doctor_id !== selectedDoctorId) return false;
    
    const appointmentDate = parseISO(apt.appointment_time);
    return isValid(appointmentDate) && format(appointmentDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  }).sort((a,b) => (a.appointment_time || "").localeCompare(b.appointment_time || ""));

  // Filter for ALL current IPD patients under the selected doctor's care
  const ipdPatients = appointments.filter(apt => 
    apt.appointment_type === 'IPD' && apt.doctor_id === selectedDoctorId
  );

  const selectedDoctorName = doctors.find(d => d.id === selectedDoctorId)?.name;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Doctor Schedules</h1>
        <p className="text-sm text-muted-foreground">View daily OPD schedules and current IPD patient lists for any doctor.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle>Controls</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-1.5">
                        <Label>1. Select Doctor</Label>
                        <Select onValueChange={setSelectedDoctorId}>
                            <SelectTrigger><SelectValue placeholder="Choose a doctor..." /></SelectTrigger>
                            <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label>2. Select Date for OPD Schedule</Label>
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Schedule Display Column */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                    {selectedDoctorId ? `Schedule for Dr. ${selectedDoctorName}` : "Select a Doctor"}
                </CardTitle>
                <CardDescription>
                    Showing OPD appointments for: {selectedDate ? format(selectedDate, "PPP") : "..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-4 flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>OPD Appointments</h3>
                <div className="space-y-4">
                  {loading && <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>}
                  {!loading && !selectedDoctorId && <div className="text-center text-muted-foreground py-8"><p>Please select a doctor to view their schedule.</p></div>}
                  {!loading && selectedDoctorId && opdSchedule.length === 0 && <div className="text-center text-muted-foreground py-8"><p>No OPD appointments scheduled for this doctor on this date.</p></div>}
                  {!loading && selectedDoctorId && opdSchedule.map(apt => (
                    <div key={apt.id} className="flex justify-between items-center p-4 rounded-lg border bg-card">
                      <div>
                        <p className="font-bold text-primary">{apt.appointment_time ? format(parseISO(apt.appointment_time), 'p') : 'No Time'}</p>
                        <p className="font-semibold">{apt.patients?.full_name ?? 'N/A'}</p>
                      </div>
                      <Badge variant="secondary">{apt.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><BedDouble className="mr-2 h-5 w-5 text-primary"/>Current IPD Patients</CardTitle>
                <CardDescription>All in-patients currently under this doctor's care.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    {!loading && selectedDoctorId && ipdPatients.length === 0 && <div className="text-center text-muted-foreground py-8"><p>This doctor has no current IPD patients.</p></div>}
                    {!loading && selectedDoctorId && ipdPatients.map(apt => (
                        <div key={apt.id} className="flex justify-between items-center p-4 rounded-lg border bg-card">
                            <div>
                                <p className="font-semibold">{apt.patients?.full_name ?? 'N/A'}</p>
                                <p className="text-sm text-muted-foreground">Admitted: {apt.appointment_time ? format(parseISO(apt.appointment_time), 'PPP') : 'N/A'}</p>
                            </div>
                            <Badge variant="outline">{apt.beds?.wards?.name} - {apt.beds?.bed_number}</Badge>
                        </div>
                    ))}
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
