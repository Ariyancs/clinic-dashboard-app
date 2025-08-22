import { useState, useEffect } from "react";
import { Plus, Stethoscope, Pill, HeartPulse, Microscope, ClipboardPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Type Definitions ---
type Patient = { id: string; full_name: string; dob: string | null; };
type Doctor = { id: string; name: string };
type Vitals = { bp?: string; pulse?: string; temp_c?: string; spo2?: string; };
type MedicalRecord = {
  id: string;
  visit_date: string;
  diagnosis: string | null;
  prescription: string | null;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  past_medical_history: string | null;
  physical_examination_findings: string | null;
  investigation_results: string | null;
  treatment_plan: string | null;
  vitals: Vitals | null;
  doctors: { name: string } | null;
};

const initialNewRecordState = {
  visit_date: format(new Date(), 'yyyy-MM-dd'),
  diagnosis: "",
  prescription: "",
  chief_complaint: "",
  history_of_present_illness: "",
  past_medical_history: "",
  physical_examination_findings: "",
  investigation_results: "",
  treatment_plan: "",
  vitals: { bp: "", pulse: "", temp_c: "", spo2: "" },
};

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
      try {
        const [patientRes, doctorRes] = await Promise.all([
          supabase.from('patients').select('id, full_name, dob').order('full_name'),
          supabase.from('doctors').select('id, name').order('name')
        ]);
        if (patientRes.error) throw patientRes.error;
        setPatients(patientRes.data || []);
        if (doctorRes.error) throw doctorRes.error;
        setDoctors(doctorRes.data || []);
      } catch (error: any) {
        toast.error("Failed to load page data.", { description: error.message });
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  const handleViewRecords = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewOpen(true);
    const { data, error } = await supabase.from('medical_records').select('*, doctors(name)').eq('patient_id', patient.id).order('visit_date', { ascending: false });
    if (error) {
      toast.error("Failed to fetch medical records.", { description: error.message });
    } else {
      setRecords((data as any) || []);
    }
  };

  const handleAddRecord = async () => {
    if (!selectedPatient || !newRecord.chief_complaint) {
      return toast.error("Chief Complaint is a required field for a new record.");
    }
    const recordToInsert = {
      ...newRecord,
      patient_id: selectedPatient.id,
      doctor_id: selectedDoctorId
    };
    const { data, error } = await supabase.from('medical_records').insert(recordToInsert).select('*, doctors(name)').single();
    if (error) {
      toast.error("Failed to add record.", { description: error.message });
    } else {
      setRecords(prev => [data as MedicalRecord, ...prev]);
      toast.success("Medical record added successfully.");
      setNewRecord(initialNewRecordState);
      setSelectedDoctorId(null);
    }
  };
  
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Patient Medical Records (EMR)</h1>
        <p className="text-sm text-muted-foreground">View and manage the complete clinical history for all patients.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>All Patients</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Date of Birth</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={3} className="text-center py-8">Loading patients...</TableCell></TableRow>}
                {!loading && patients.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{p.dob ? format(parseISO(p.dob), 'PPP') : 'N/A'}</TableCell>
                    <TableCell className="text-right"><Button onClick={() => handleViewRecords(p)}>View EMR</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Electronic Medical Record (EMR) for {selectedPatient?.full_name}</DialogTitle>
            <DialogDescription>A complete history of all clinical encounters.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 max-h-[75vh]">
            <div className="md:col-span-1 border-r pr-6 overflow-y-auto">
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Encounter History</h3>
              <div className="space-y-2">
                {records.length > 0 ? records.map(rec => (
                  <div key={rec.id} className="border rounded-lg p-3 text-sm hover:bg-secondary">
                    <p className="font-bold">Visit: {format(parseISO(rec.visit_date), 'PPP')}</p>
                    <p className="text-xs text-muted-foreground">Dr. {rec.doctors?.name || 'N/A'}</p>
                    <p className="mt-1 truncate"><strong>Complaint:</strong> {rec.chief_complaint}</p>
                  </div>
                )) : <p className="text-muted-foreground text-center py-8 text-sm">No records found.</p>}
              </div>
            </div>
            <div className="md:col-span-2 space-y-4 overflow-y-auto">
              <Tabs defaultValue="new_record">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new_record"><Plus className="mr-2 h-4 w-4"/>Add New Encounter</TabsTrigger>
                  <TabsTrigger value="history">View Full History</TabsTrigger>
                </TabsList>
                <TabsContent value="new_record" className="p-4 border rounded-lg">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5"><Label>Visit Date</Label><Input type="date" value={newRecord.visit_date} onChange={e => setNewRecord({...newRecord, visit_date: e.target.value})} /></div>
                      <div className="grid gap-1.5"><Label>Attending Doctor</Label><Select onValueChange={id => setSelectedDoctorId(id)}><SelectTrigger><SelectValue placeholder="Select doctor..." /></SelectTrigger><SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div className="grid gap-1.5"><Label>Chief Complaint</Label><Textarea placeholder="e.g., Fever and cough for 3 days..." value={newRecord.chief_complaint} onChange={e => setNewRecord({...newRecord, chief_complaint: e.target.value})} /></div>
                    <div className="grid gap-1.5"><Label>History of Present Illness</Label><Textarea value={newRecord.history_of_present_illness} onChange={e => setNewRecord({...newRecord, history_of_present_illness: e.target.value})} /></div>
                    <div className="grid gap-1.5"><Label>Vitals</Label>
                      <div className="grid grid-cols-4 gap-2 p-2 border rounded-md">
                        <Input placeholder="BP" value={newRecord.vitals.bp} onChange={e => setNewRecord({...newRecord, vitals: {...newRecord.vitals, bp: e.target.value}})} />
                        <Input placeholder="Pulse" value={newRecord.vitals.pulse} onChange={e => setNewRecord({...newRecord, vitals: {...newRecord.vitals, pulse: e.target.value}})} />
                        <Input placeholder="Temp (°C)" value={newRecord.vitals.temp_c} onChange={e => setNewRecord({...newRecord, vitals: {...newRecord.vitals, temp_c: e.target.value}})} />
                        <Input placeholder="SpO2 (%)" value={newRecord.vitals.spo2} onChange={e => setNewRecord({...newRecord, vitals: {...newRecord.vitals, spo2: e.target.value}})} />
                      </div>
                    </div>
                    <div className="grid gap-1.5"><Label>Physical Examination Findings</Label><Textarea value={newRecord.physical_examination_findings} onChange={e => setNewRecord({...newRecord, physical_examination_findings: e.target.value})} /></div>
                    <div className="grid gap-1.5"><Label>Investigation Results</Label><Textarea value={newRecord.investigation_results} onChange={e => setNewRecord({...newRecord, investigation_results: e.target.value})} /></div>
                    <div className="grid gap-1.5"><Label>Diagnosis</Label><Textarea value={newRecord.diagnosis} onChange={e => setNewRecord({...newRecord, diagnosis: e.target.value})} /></div>
                    <div className="grid gap-1.5"><Label>Treatment Plan / Prescription</Label><Textarea value={newRecord.prescription} onChange={e => setNewRecord({...newRecord, prescription: e.target.value})} /></div>
                    <Button onClick={handleAddRecord} className="w-full"><ClipboardPlus className="mr-2 h-4 w-4"/> Save Encounter Record</Button>
                  </div>
                </TabsContent>
                <TabsContent value="history">
                  {/* Future implementation: A more detailed history view can be built here */}
                  <p className="text-muted-foreground text-center p-8">Full history view coming soon.</p>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
