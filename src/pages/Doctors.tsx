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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

// Type to match your schema
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

// Initial state for the form, matching all database fields
const initialNewDoctorState = {
    name: "",
    specialization: "",
    qualification: "",
    experience: "",
    contact: "",
    email: "",
    schedule: ""
};

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState(initialNewDoctorState);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('doctors').select('*').order('name', { ascending: true });
      if (error) toast.error("Failed to load doctors.", { description: error.message });
      else setDoctors(data as Doctor[]);
      setLoading(false);
    };
    fetchDoctors();
  }, []);

  const handleAddDoctor = async () => {
    if (!newDoctor.name) return toast.error("Doctor's Name is a required field.");

    // This is now a simple database insert, as doctors are independent
    const { data, error } = await supabase.from('doctors').insert(newDoctor).select().single();
    if (error) {
      toast.error("Failed to add doctor.", { description: error.message });
    } else {
      setDoctors(prev => [data, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Doctor added successfully!");
      setIsAddOpen(false);
      setNewDoctor(initialNewDoctorState);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    const { error } = await supabase.from('doctors').delete().eq('id', doctorId);
    if (error) toast.error("Failed to delete doctor.", { description: error.message });
    else {
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
      toast.success("Doctor removed successfully.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Doctor Management</h1>
          <p className="text-muted-foreground">Manage doctor profiles and schedules.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Doctor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>Enter the doctor's professional details.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2 col-span-2"><Label>Full Name</Label><Input value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} /></div>
                <div className="space-y-2"><Label>Specialization</Label><Input value={newDoctor.specialization} onChange={e => setNewDoctor({...newDoctor, specialization: e.target.value})} /></div>
                <div className="space-y-2"><Label>Qualification</Label><Input value={newDoctor.qualification} onChange={e => setNewDoctor({...newDoctor, qualification: e.target.value})} /></div>
                <div className="space-y-2"><Label>Experience</Label><Input value={newDoctor.experience} onChange={e => setNewDoctor({...newDoctor, experience: e.target.value})} /></div>
                <div className="space-y-2"><Label>Contact Number</Label><Input value={newDoctor.contact} onChange={e => setNewDoctor({...newDoctor, contact: e.target.value})} /></div>
                <div className="space-y-2 col-span-2"><Label>Email</Label><Input type="email" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} /></div>
                <div className="space-y-2 col-span-2"><Label>Schedule</Label><Input value={newDoctor.schedule} onChange={e => setNewDoctor({...newDoctor, schedule: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddDoctor}>Save Doctor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p>Loading...</p> : doctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16"><AvatarImage src={undefined} /><AvatarFallback>{doctor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{doctor.name}</h3>
                        <p className="text-primary font-medium">{doctor.specialization}</p>
                        <p className="text-sm text-muted-foreground">{doctor.qualification}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteDoctor(doctor.id)} className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground"><strong>Contact:</strong> {doctor.contact || 'N/A'}</p>
                <p className="text-sm text-muted-foreground"><strong>Schedule:</strong> {doctor.schedule || 'N/A'}</p>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}