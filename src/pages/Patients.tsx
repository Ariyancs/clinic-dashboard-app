import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { format, parseISO } from 'date-fns';

type Patient = { id: string; full_name: string; dob: string; phone: string; created_at: string };
const initialState = { full_name: "", dob: "", phone: "" };

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPatient, setNewPatient] = useState(initialState);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
      if (error) toast.error("Failed to load patients.", { description: error.message });
      else setPatients(data as Patient[]);
      setLoading(false);
    };
    fetchPatients();
  }, []);

  const handleAddPatient = async () => {
    if (!newPatient.full_name) return toast.error("Full Name is required.");
    const { data, error } = await supabase.from('patients').insert(newPatient).select().single();
    if (error) toast.error("Failed to add patient.", { description: error.message });
    else {
      setPatients(prev => [data, ...prev]);
      toast.success("Patient added successfully!");
      setIsAddOpen(false);
      setNewPatient(initialState);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!window.confirm("Are you sure?")) return;
    const { error } = await supabase.from('patients').delete().eq('id', patientId);
    if (error) toast.error("Failed to delete patient.", { description: error.message });
    else {
      setPatients(prev => prev.filter(p => p.id !== patientId));
      toast.success("Patient record deleted.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">Patient Management</h1></div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Patient</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Patient</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-1.5"><Label>Full Name</Label><Input value={newPatient.full_name} onChange={e => setNewPatient({...newPatient, full_name: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Date of Birth</Label><Input type="date" value={newPatient.dob} onChange={e => setNewPatient({...newPatient, dob: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Phone Number</Label><Input value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button onClick={handleAddPatient}>Save Patient</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Full Name</TableHead><TableHead>Date of Birth</TableHead><TableHead>Phone</TableHead><TableHead>Registered</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>}
              {!loading && patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.full_name}</TableCell><TableCell>{p.dob ? format(parseISO(p.dob), 'PPP') : 'N/A'}</TableCell><TableCell>{p.phone || 'N/A'}</TableCell>
                  <TableCell>{format(parseISO(p.created_at), 'PPP')}</TableCell>
                  <TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => handleDeletePatient(p.id)} className="text-destructive">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}