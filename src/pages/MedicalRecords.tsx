import { useState, useEffect } from "react";
import { Plus, Stethoscope, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Type Definitions ---
type Patient = { id: string; full_name: string; dob: string | null; };
type Doctor = { id: string; name: string };
type MedicalRecord = {
  id: string;
  visit_date: string;
  diagnosis: string;
  prescription: string;
  doctors: { name: string } | null;
};
const initialNewRecordState = { visit_date: format(new Date(), 'yyyy-MM-dd'), diagnosis: "", prescription: "" };

export default function MedicalRecords() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [newRecord, setNewRecord] = useState(initialNewRecordState);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const [patientRes, doctorRes] = await Promise.all([
        supabase.from('patients').select('id, full_name, dob').order('full_name'),
        supabase.from('doctors').select('id, name').order('name')
      ]);
      if (patientRes.error || doctorRes.error) {
        toast.error("Failed to load page data.", { description: patientRes.error?.message || doctorRes.error?.message });
      } else {
        setPatients(patientRes.data || []);
        setDoctors(doctorRes.data || []);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  const handleViewRecords = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewOpen(true);
    const { data, error } = await supabase.from('medical_records').select('*, doctors(name)').eq('patient_id', patient.id).order('visit_date', { ascending: false });
    if (error) toast.error("Failed to fetch medical records.", { description: error.message });
    else setRecords(data as MedicalRecord[]);
  };

  const handleAddRecord = async () => {
    if (!selectedPatient || !newRecord.diagnosis) return toast.error("Diagnosis is required.");
    const { data, error } = await supabase.from('medical_records').insert({ ...newRecord, patient_id: selectedPatient.id, doctor_id: selectedDoctorId }).select('*, doctors(name)').single();
    if (error) toast.error("Failed to add record.", { description: error.message });
    else {
      setRecords(prev => [data as MedicalRecord, ...prev]);
      toast.success("Medical record added.");
      setNewRecord(initialNewRecordState);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl font-bold">Patient Medical Records</h1><p className="text-muted-foreground">View and manage patient history.</p></div>
      <Card>
        <CardHeader><CardTitle>All Patients</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Date of Birth</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={3} className="text-center">Loading patients...</TableCell></TableRow>}
              {!loading && patients.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.full_name}</TableCell>
                  <TableCell>{p.dob ? format(parseISO(p.dob), 'PPP') : 'N/A'}</TableCell>
                  <TableCell className="text-right"><Button onClick={() => handleViewRecords(p)}>View Records</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Medical History for {selectedPatient?.full_name}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-6 py-4 max-h-[70vh] overflow-y-auto">
            <div className="col-span-2 space-y-4">
              <h3 className="font-semibold text-lg">Existing Records</h3>
              {records.length > 0 ? records.map(rec => (
                <div key={rec.id} className="border rounded-lg p-4">
                  <p className="font-bold text-sm">Visit Date: {format(parseISO(rec.visit_date), 'PPP')}</p>
                  <p className="text-sm text-muted-foreground">Attending Doctor: {rec.doctors?.name || 'N/A'}</p>
                  <p className="mt-2"><strong>Diagnosis:</strong> {rec.diagnosis}</p>
                  <p className="mt-1"><strong>Prescription:</strong> {rec.prescription}</p>
                </div>
              )) : <p className="text-muted-foreground">No records found.</p>}
            </div>
            <div className="space-y-4 border-l pl-6">
              <h3 className="font-semibold text-lg">Add New Record</h3>
              <div className="grid gap-1.5"><Label>Visit Date</Label><Input type="date" value={newRecord.visit_date} onChange={e => setNewRecord({...newRecord, visit_date: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Attending Doctor</Label><Select onValueChange={id => setSelectedDoctorId(id)}><SelectTrigger><SelectValue placeholder="Select doctor..." /></SelectTrigger><SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-1.5"><Label>Diagnosis</Label><Textarea value={newRecord.diagnosis} onChange={e => setNewRecord({...newRecord, diagnosis: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Prescription</Label><Textarea value={newRecord.prescription} onChange={e => setNewRecord({...newRecord, prescription: e.target.value})} /></div>
              <Button onClick={handleAddRecord} className="w-full"><Plus className="mr-2 h-4 w-4"/> Add Record</Button>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}