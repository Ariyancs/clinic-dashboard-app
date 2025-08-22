import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Trash2, FilePenLine, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from 'date-fns';
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// --- Type Definitions ---
type Doctor = { id: string; name: string; };

type PatientFull = {
  id: string;
  registration_no: string;
  full_name: string;
  address: string | null;
  phone_no: string | null;
  emergency_no: string | null;
  passport_no: string | null;
  dob: string | null;
  gender: string | null; // Added gender
  religion: string | null;
  country: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_address: string | null;
  guardian_passport_no: string | null;
  is_corporate: boolean;
  insurance_company: string | null;
  insurance_address: string | null;
  doctor_incharge_1_id: string | null;
  doctor_incharge_2_id: string | null;
  admission_date: string;
  created_at: string;
  doctors: { name: string } | null; 
  doctors_incharge_2: { name: string } | null;
};

type PatientDisplay = {
  id: string;
  registration_no: string;
  full_name: string;
  admission_date: string;
  phone_no: string | null;
};

const initialState = {
  full_name: "", address: "", phone_no: "", emergency_no: "", passport_no: "",
  dob: "", gender: "", religion: "", country: "", guardian_name: "", guardian_relation: "",
  guardian_address: "", guardian_passport_no: "", is_corporate: false,
  insurance_company: "", insurance_address: "", doctor_incharge_1_id: null, doctor_incharge_2_id: null,
};

const calculateAge = (dob: string | null): string => {
  if (!dob) return 'N/A';
  try {
    const birthDate = parseISO(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} Years`;
  } catch (error) {
    return 'N/A';
  }
};

export default function Patients() {
  const [patients, setPatients] = useState<PatientDisplay[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [newPatient, setNewPatient] = useState(initialState);
  const [editingPatient, setEditingPatient] = useState<PatientFull | null>(null);
  const [patientToPrint, setPatientToPrint] = useState<PatientFull | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          supabase.from('patients').select('id, registration_no, full_name, admission_date, phone_no').order('created_at', { ascending: false }),
          supabase.from('doctors').select('id, name').order('name')
        ]);
        
        if (patientsRes.error) throw patientsRes.error;
        setPatients(patientsRes.data || []);

        if (doctorsRes.error) throw doctorsRes.error;
        setDoctors(doctorsRes.data || []);
      } catch (error: any) {
        toast.error("Failed to load page data.", { description: error.message });
        console.error("Data loading error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddPatient = async () => {
    if (!newPatient.full_name) return toast.error("Patient's Full Name is a required field.");
    const patientData = Object.fromEntries(Object.entries(newPatient).filter(([, value]) => value !== "" && value !== null));
    const { data, error } = await supabase.from('patients').insert(patientData).select('id, registration_no, full_name, admission_date, phone_no').single();
    if (error) {
      toast.error("Failed to admit patient.", { description: error.message });
    } else {
      setPatients(prev => [data, ...prev]);
      toast.success(`Patient ${data.full_name} admitted!`, { description: `Registration No: ${data.registration_no}` });
      setIsAddOpen(false);
      setNewPatient(initialState);
    }
  };

  const handleOpenEditDialog = async (patientId: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('patients').select('*').eq('id', patientId).single();
    if (error || !data) {
      toast.error("Failed to fetch patient details.", { description: error?.message });
    } else {
      setEditingPatient(data);
      setIsEditOpen(true);
    }
    setLoading(false);
  };

  const handleUpdatePatient = async () => {
    if (!editingPatient || !editingPatient.full_name) return toast.error("Patient's Full Name is required.");
    const { id, registration_no, admission_date, created_at, doctors, doctors_incharge_2, ...updateData } = editingPatient;
    const { data, error } = await supabase.from('patients').update(updateData).eq('id', id).select('id, registration_no, full_name, admission_date, phone_no').single();
    if (error) {
      toast.error("Failed to update patient.", { description: error.message });
    } else {
      setPatients(prev => prev.map(p => p.id === data.id ? data : p));
      toast.success("Patient details updated successfully!");
      setIsEditOpen(false);
      setEditingPatient(null);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    const { error } = await supabase.from('patients').delete().eq('id', patientId);
    if (error) {
      toast.error("Failed to delete patient.", { description: error.message });
    } else {
      setPatients(prev => prev.filter(p => p.id !== patientId));
      toast.success("Patient record has been deleted.");
    }
  };

  const handleOpenPrintDialog = async (patientId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*, doctors:doctor_incharge_1_id(name), doctors_incharge_2:doctor_incharge_2_id(name)')
      .eq('id', patientId)
      .single();
    if (error || !data) {
      toast.error("Failed to fetch patient details for printing.", { description: error?.message });
    } else {
      setPatientToPrint(data);
      setIsPrintOpen(true);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printableArea')?.innerHTML;
    if (printContent) {
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = `<div class="print-container">${printContent}</div>`;
      window.print();
      document.body.innerHTML = originalContent;
      setTimeout(() => {
        window.location.reload();
      }, 1);
    }
  };

  const handleEditFormChange = (field: keyof PatientFull, value: any) => {
    setEditingPatient(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Patient Admissions</h1>
          <p className="text-sm text-muted-foreground">Admit new patients and manage records.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> New Admission</Button></DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>New Patient Admission Form</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 max-h-[75vh] overflow-y-auto pr-6">
              <div className="col-span-full font-semibold text-primary border-b pb-2">Admission Details</div>
              <div className="grid gap-1.5"><Label>Admission Date</Label><Input type="text" value={format(new Date(), 'PPP p')} readOnly disabled /></div>
              <div className="grid gap-1.5"><Label>Doctor Incharge 1</Label><Select onValueChange={v => setNewPatient({...newPatient, doctor_incharge_1_id: v})}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-1.5"><Label>Doctor Incharge 2</Label><Select onValueChange={v => setNewPatient({...newPatient, doctor_incharge_2_id: v})}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="col-span-full font-semibold text-primary border-b pb-2 mt-4">Personal Details</div>
              <div className="grid gap-1.5 md:col-span-2"><Label>Full Name*</Label><Input value={newPatient.full_name} onChange={e => setNewPatient({...newPatient, full_name: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Date of Birth</Label><Input type="date" value={newPatient.dob} onChange={e => setNewPatient({...newPatient, dob: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Gender</Label><Select onValueChange={v => setNewPatient({...newPatient, gender: v})}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
              <div className="grid gap-1.5 col-span-full"><Label>Address</Label><Textarea value={newPatient.address} onChange={e => setNewPatient({...newPatient, address: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Phone Number</Label><Input value={newPatient.phone_no} onChange={e => setNewPatient({...newPatient, phone_no: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Emergency Number</Label><Input value={newPatient.emergency_no} onChange={e => setNewPatient({...newPatient, emergency_no: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Passport Number</Label><Input value={newPatient.passport_no} onChange={e => setNewPatient({...newPatient, passport_no: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Religion</Label><Input value={newPatient.religion} onChange={e => setNewPatient({...newPatient, religion: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Country</Label><Input value={newPatient.country} onChange={e => setNewPatient({...newPatient, country: e.target.value})} /></div>
              <div className="col-span-full font-semibold text-primary border-b pb-2 mt-4">Guardian Details</div>
              <div className="grid gap-1.5"><Label>Guardian Name</Label><Input value={newPatient.guardian_name} onChange={e => setNewPatient({...newPatient, guardian_name: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Relation</Label><Input value={newPatient.guardian_relation} onChange={e => setNewPatient({...newPatient, guardian_relation: e.target.value})} /></div>
              <div className="grid gap-1.5"><Label>Guardian Passport No.</Label><Input value={newPatient.guardian_passport_no} onChange={e => setNewPatient({...newPatient, guardian_passport_no: e.target.value})} /></div>
              <div className="grid gap-1.5 col-span-full"><Label>Guardian Address</Label><Textarea value={newPatient.guardian_address} onChange={e => setNewPatient({...newPatient, guardian_address: e.target.value})} /></div>
              <div className="col-span-full font-semibold text-primary border-b pb-2 mt-4">Insurance & Corporate</div>
              <div className="grid gap-1.5"><Label>Insurance Company</Label><Input value={newPatient.insurance_company} onChange={e => setNewPatient({...newPatient, insurance_company: e.target.value})} /></div>
              <div className="grid gap-1.5 md:col-span-2"><Label>Insurance Address</Label><Textarea value={newPatient.insurance_address} onChange={e => setNewPatient({...newPatient, insurance_address: e.target.value})} /></div>
              <div className="col-span-full flex items-center space-x-2 pt-4"><Checkbox id="is_corporate" checked={newPatient.is_corporate} onCheckedChange={checked => setNewPatient({...newPatient, is_corporate: !!checked})} /><Label htmlFor="is_corporate">This is a corporate patient</Label></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => { setIsAddOpen(false); setNewPatient(initialState); }}>Cancel</Button><Button onClick={handleAddPatient}>Admit Patient</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader><DialogTitle>Edit Patient Details for {editingPatient?.full_name}</DialogTitle></DialogHeader>
            {loading && <div className="text-center p-8">Loading...</div>}
            {editingPatient && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 max-h-[75vh] overflow-y-auto pr-6">
                <div className="col-span-full font-semibold text-primary border-b pb-2">Admission Details</div>
                <div className="grid gap-1.5"><Label>Admission Date</Label><Input type="text" value={format(parseISO(editingPatient.admission_date), 'PPP p')} readOnly disabled /></div>
                <div className="grid gap-1.5"><Label>Doctor Incharge 1</Label><Select value={editingPatient.doctor_incharge_1_id || ''} onValueChange={v => handleEditFormChange('doctor_incharge_1_id', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid gap-1.5"><Label>Doctor Incharge 2</Label><Select value={editingPatient.doctor_incharge_2_id || ''} onValueChange={v => handleEditFormChange('doctor_incharge_2_id', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="col-span-full font-semibold text-primary border-b pb-2 mt-4">Personal Details</div>
                <div className="grid gap-1.5 md:col-span-2"><Label>Full Name*</Label><Input value={editingPatient.full_name} onChange={e => handleEditFormChange('full_name', e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Date of Birth</Label><Input type="date" value={editingPatient.dob || ''} onChange={e => handleEditFormChange('dob', e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Gender</Label><Select value={editingPatient.gender || ''} onValueChange={v => handleEditFormChange('gender', v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                <div className="grid gap-1.5 col-span-full"><Label>Address</Label><Textarea value={editingPatient.address || ''} onChange={e => handleEditFormChange('address', e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Phone Number</Label><Input value={editingPatient.phone_no || ''} onChange={e => handleEditFormChange('phone_no', e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Emergency Number</Label><Input value={editingPatient.emergency_no || ''} onChange={e => handleEditFormChange('emergency_no', e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Passport Number</Label><Input value={editingPatient.passport_no || ''} onChange={e => handleEditFormChange('passport_no', e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Religion</Label><Input value={editingPatient.religion || ''} onChange={e => handleEditFormChange('religion', e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Country</Label><Input value={editingPatient.country || ''} onChange={e => handleEditFormChange('country', e.target.value)} /></div>
                <div className="col-span-full font-semibold text-primary border-b pb-2 mt-4">Guardian Details</div>
                <div className="grid gap-1.5"><Label>Guardian Name</Label><Input value={editingPatient.guardian_name || ''} onChange={e => handleEditFormChange('guardian_name', e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Relation</Label><Input value={editingPatient.guardian_relation || ''} onChange={e => handleEditFormChange('guardian_relation', e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Guardian Passport No.</Label><Input value={editingPatient.guardian_passport_no || ''} onChange={e => handleEditFormChange('guardian_passport_no', e.target.value)} /></div>
                <div className="grid gap-1.5 col-span-full"><Label>Guardian Address</Label><Textarea value={editingPatient.guardian_address || ''} onChange={e => handleEditFormChange('guardian_address', e.target.value)} /></div>
                <div className="col-span-full font-semibold text-primary border-b pb-2 mt-4">Insurance & Corporate</div>
                <div className="grid gap-1.5"><Label>Insurance Company</Label><Input value={editingPatient.insurance_company || ''} onChange={e => handleEditFormChange('insurance_company', e.target.value)} /></div>
                <div className="grid gap-1.5 md:col-span-2"><Label>Insurance Address</Label><Textarea value={editingPatient.insurance_address || ''} onChange={e => handleEditFormChange('insurance_address', e.target.value)} /></div>
                <div className="col-span-full flex items-center space-x-2 pt-4"><Checkbox id="edit_is_corporate" checked={editingPatient.is_corporate} onCheckedChange={checked => handleEditFormChange('is_corporate', !!checked)} /><Label htmlFor="edit_is_corporate">This is a corporate patient</Label></div>
              </div>
            )}
            <DialogFooter><Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button onClick={handleUpdatePatient}>Save Changes</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
          <DialogContent className="max-w-4xl">
            {patientToPrint && (
              <div id="printableArea" className="text-black bg-white p-8">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold">Srijoni Healing Home Pvt.Ltd.</h2>
                  <p className="text-sm">56 HEM CHANDRA NASKAR ROAD,BELIAGHATA, KOLKATA-700010</p>
                  <p className="text-sm">PHONE :: 2372-0038</p>
                </div>
                <div className="text-center mb-4">
                  <span className="px-4 py-1 text-xl font-semibold border-2 border-black">ADMISSION FORM</span>
                </div>
                
                <div className="border-2 border-black p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><strong>Bed No.:</strong> _________________</div>
                  <div><strong>Reg.No.:</strong> {patientToPrint.registration_no}</div>
                  <div className="col-span-2"><strong>Name of Patient:</strong> {patientToPrint.full_name}</div>
                  <div className="col-span-2"><strong>Address:</strong> {patientToPrint.address || 'N/A'}</div>
                  <div><strong>Guardian Name:</strong> {patientToPrint.guardian_name || 'N/A'}</div>
                  <div><strong>Date & Time of Admission:</strong> {format(parseISO(patientToPrint.admission_date), 'dd/MM/yyyy hh:mm a')}</div>
                  <div><strong>Relation:</strong> {patientToPrint.guardian_relation || 'N/A'}</div>
                  <div><strong>Phone No.:</strong> {patientToPrint.phone_no || 'N/A'}</div>
                  <div><strong>Under Doctor:</strong> {patientToPrint.doctors?.name || '_________________'}</div>
                  <div><strong>Gender:</strong> {patientToPrint.gender || '_________________'}</div>
                  <div><strong>Consultant Dr.:</strong> _________________</div>
                  <div><strong>Age:</strong> {calculateAge(patientToPrint.dob)}</div>
                  <div><strong>Ref. Doctor:</strong> _________________</div>
                  <div><strong>Religion:</strong> {patientToPrint.religion || 'N/A'}</div>
                  <div className="col-span-2"><strong>Case:</strong> _________________</div>
                </div>

                <div className="mt-4 border-2 border-black">
                  <div className="p-2 font-bold text-center bg-gray-200">Baby's History:</div>
                  <table className="w-full text-center text-sm">
                    <thead><tr className="border-b-2 border-black"><th className="p-1 border-r-2 border-black">Date of Birth</th><th className="p-1 border-r-2 border-black">Birth Time</th><th className="p-1 border-r-2 border-black">Baby's Weight</th><th className="p-1 border-r-2 border-black">Sex of Baby</th><th className="p-1 border-r-2 border-black">Details</th><th className="p-1">Live / Still Born / IUFD</th></tr></thead>
                    <tbody><tr><td className="p-2 border-r-2 border-black h-12"></td><td className="p-2 border-r-2 border-black"></td><td className="p-2 border-r-2 border-black"></td><td className="p-2 border-r-2 border-black"></td><td className="p-2 border-r-2 border-black"></td><td className="p-2"></td></tr></tbody>
                  </table>
                </div>

                <p className="text-xs mt-4">
                  I hereby agree and give consent to performance of such operations on me / my ward that may be considered necessary to the administration of anaesthesia and to any type of investigation that may be advised by the doctor. I shall not hold the institute, its staff and/or the doctor responsible for any consequence arising out of and in the course of such operation, administration of anaesthesia/drug or any investigation/treatment.
                  I wish that I / my ward be admitted as a patient in the nursing home and I agree to pay the scheduled charges for accommodation & diet, investigation, treatment doctor's fees and other charges as per the rules of the institute. I also realise that I shall have to provide all medicines, injections etc. As prescribed for me/my ward.
                </p>

                <div className="mt-16 flex justify-between text-sm">
                  <div><div className="border-t-2 border-black pt-1">Signature of the Patient / Guardian</div></div>
                  <div><div className="border-t-2 border-black pt-1">Signature of the Surgeon / Physician</div></div>
                </div>

                <div className="mt-6 flex justify-between gap-4 text-sm">
                  <div className="border-2 border-black p-4 flex-1">
                    Certified that the Patient is admitted to this Nursing Home on instruction and treated by me.
                  </div>
                  <div className="border-2 border-black p-4 flex-1">
                    I am leaving / taking away my patient from this Nursing Home being <br/> <strong>Discharge</strong> <br/> on............................................. <br/>
                    <div className="mt-8 border-t-2 border-black text-center pt-1">Signature of the Patient / Guardian</div>
                    <br/><strong>Discharge on Risk Bond</strong><br/> on............................................. <br/>
                    <div className="mt-8 border-t-2 border-black text-center pt-1">Signature of the Patient / Guardian</div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="no-print">
              <Button variant="outline" onClick={() => setIsPrintOpen(false)}>Close</Button>
              <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Admission Form</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader><CardTitle>Admitted Patients</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Reg. No</TableHead><TableHead>Full Name</TableHead><TableHead className="hidden sm:table-cell">Admission Date</TableHead><TableHead className="hidden md:table-cell">Phone</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading && <TableRow><TableCell colSpan={5} className="text-center py-10">Loading patients...</TableCell></TableRow>}
                  {!loading && patients.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10">No patients found. Click "New Admission" to begin.</TableCell></TableRow>}
                  {!loading && patients.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.registration_no}</TableCell>
                      <TableCell className="font-medium">{p.full_name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{p.admission_date ? format(parseISO(p.admission_date), 'PPP') : 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.phone_no || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenPrintDialog(p.id)}><Printer className="mr-2 h-4 w-4" /> Print</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditDialog(p.id)}><FilePenLine className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeletePatient(p.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </div>
    </div>
  );
}
