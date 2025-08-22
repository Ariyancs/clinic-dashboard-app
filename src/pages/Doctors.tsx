import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// --- Type Definitions ---
// Updated to match the provided SQL schema
type Doctor = {
  id: string;
  name: string;
  specialization: string | null;
  qualification: string | null;
  experience: string | null;
  contact: string | null;
  email: string | null;
  schedule: string | null;
};

const initialNewDoctorState = {
    name: "",
    specialization: "",
    qualification: "",
    experience: "",
    contact: "",
    email: "",
    schedule: "",
};

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState(initialNewDoctorState);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Updated to only fetch doctors
        const { data, error } = await supabase.from('doctors').select('*').order('name', { ascending: true });
        if (error) throw error;
        setDoctors(data || []);
      } catch (error: any) {
        toast.error("Failed to load page data.", { description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddDoctor = async () => {
    if (!newDoctor.name) {
      return toast.error("Doctor's Name is a required field.");
    }
    // Updated to remove department logic
    const { data, error } = await supabase.from('doctors').insert(newDoctor).select().single();
    if (error) {
      toast.error("Failed to add doctor.", { description: error.message });
    } else {
      setDoctors(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Doctor added successfully!");
      setIsAddOpen(false);
      setNewDoctor(initialNewDoctorState);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    const { error } = await supabase.from('doctors').delete().eq('id', doctorId);
    if (error) {
      toast.error("Failed to delete doctor.", { description: error.message });
    } else {
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
      toast.success("Doctor removed successfully.");
    }
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Doctor Management</h1>
          <p className="text-sm text-muted-foreground">Manage doctor profiles and schedules.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Add Doctor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>Enter the doctor's professional details.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2 col-span-2"><Label>Full Name*</Label><Input value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} /></div>
                <div className="space-y-2"><Label>Specialization</Label><Input value={newDoctor.specialization || ''} onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})} /></div>
                <div className="space-y-2"><Label>Qualification</Label><Input value={newDoctor.qualification || ''} onChange={e => setNewDoctor({...newDoctor, qualification: e.target.value})} /></div>
                <div className="space-y-2"><Label>Experience</Label><Input value={newDoctor.experience || ''} onChange={e => setNewDoctor({...newDoctor, experience: e.target.value})} /></div>
                <div className="space-y-2"><Label>Contact Number</Label><Input value={newDoctor.contact || ''} onChange={e => setNewDoctor({...newDoctor, contact: e.target.value})} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={newDoctor.email || ''} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} /></div>
                <div className="space-y-2 col-span-2"><Label>Schedule</Label><Input value={newDoctor.schedule || ''} onChange={e => setNewDoctor({...newDoctor, schedule: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddDoctor}>Save Doctor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && [...Array(3)].map((_, i) => (
            <Card key={i}>
                <CardHeader><Skeleton className="h-20 w-full" /></CardHeader>
                <CardContent><Skeleton className="h-10 w-full" /></CardContent>
            </Card>
        ))}
        {!loading && doctors.map((doctor) => (
            <Card key={doctor.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16"><AvatarFallback>{getInitials(doctor.name)}</AvatarFallback></Avatar>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg">{doctor.name}</h3>
                            <p className="text-primary font-medium">{doctor.specialization}</p>
                            <p className="text-sm text-muted-foreground">{doctor.qualification}</p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteDoctor(doctor.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <p className="text-sm text-muted-foreground"><strong>Contact:</strong> {doctor.contact || 'N/A'}</p>
                <p className="text-sm text-muted-foreground"><strong>Schedule:</strong> {doctor.schedule || 'N/A'}</p>
              </CardContent>
            </Card>
          ))}
          {!loading && doctors.length === 0 && (
            <p className="text-muted-foreground text-center col-span-full py-10">No doctors have been added yet.</p>
          )}
      </div>
    </div>
  );
}
