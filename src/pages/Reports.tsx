import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";

// --- Type Definitions ---
type Patient = {
  id: string;
  full_name: string;
  dob: string | null;
  phone_no: string | null;
};

const certificateTypes = [
  { value: 'birth', label: 'Birth Certificate' },
  { value: 'death', label: 'Death Certificate' },
  { value: 'discharge', label: 'Discharge Certificate' },
  { value: 'police', label: 'Police Report' },
];

export default function Reports() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedCert, setSelectedCert] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('patients').select('id, full_name, dob, phone_no');
      if (error) {
        toast.error("Failed to load patients.", { description: error.message });
      } else {
        setPatients(data || []);
      }
      setLoading(false);
    };
    fetchPatients();
  }, []);

  const handlePatientChange = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId) || null;
    setSelectedPatient(patient);
    // Reset form data when patient changes
    setFormData({});
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-area')?.innerHTML;
    if (printContent) {
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = `<div class="print-container">${printContent}</div>`;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const renderCertificatePreview = () => {
    if (!selectedPatient || !selectedCert) return null;
    
    const certLabel = certificateTypes.find(c => c.value === selectedCert)?.label;

    return (
      <Card className="mt-6">
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Certificate Preview</CardTitle>
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Certificate</Button>
            </div>
        </CardHeader>
        <CardContent>
            <div id="printable-area" className="border rounded-lg p-8 bg-white text-black">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold">Srijoni Healing Home</h1>
                  <p className="text-sm">56 HEM CHANDRA NASKAR ROAD,BELIAGHATA, KOLKATA-700010</p>
                  <h2 className="text-xl font-semibold mt-4 underline">{certLabel}</h2>
                </div>
                
                <div className="space-y-4 text-base">
                  <p><strong>Patient Name:</strong> {selectedPatient.full_name}</p>
                  <p><strong>Date of Birth:</strong> {selectedPatient.dob ? format(parseISO(selectedPatient.dob), 'PPP') : 'N/A'}</p>
                  <p><strong>Contact Phone:</strong> {selectedPatient.phone_no || 'N/A'}</p>

                  {selectedCert === 'birth' && <>
                    <p><strong>Father's Name:</strong> {formData.fatherName || '________________'}</p>
                    <p><strong>Mother's Name:</strong> {formData.motherName || '________________'}</p>
                  </>}
                  {selectedCert === 'death' && <>
                    <p><strong>Date of Death:</strong> {formData.dod ? format(parseISO(formData.dod), 'PPP') : '________________'}</p>
                    <p><strong>Cause of Death:</strong> {formData.cause || '________________'}</p>
                  </>}
                  {selectedCert === 'discharge' && <>
                    <p><strong>Date of Admission:</strong> {formData.doa ? format(parseISO(formData.doa), 'PPP') : '________________'}</p>
                    <p><strong>Date of Discharge:</strong> {formData.dodischarge ? format(parseISO(formData.dodischarge), 'PPP') : '________________'}</p>
                  </>}
                   {selectedCert === 'police' && <>
                    <p><strong>Incident Date:</strong> {formData.incidentDate ? format(parseISO(formData.incidentDate), 'PPP') : '________________'}</p>
                    <p><strong>Details of Incident:</strong> {formData.details || '________________'}</p>
                  </>}
                </div>
                <div className="mt-24 text-right">
                  <p className="border-t border-black pt-2 inline-block">Authorized Signature</p>
                </div>
            </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderFormFields = () => {
    if (!selectedPatient || !selectedCert) return null;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {selectedCert === 'birth' && <>
            <div className="space-y-1"><Label>Father's Name</Label><Input onChange={e => setFormData({...formData, fatherName: e.target.value})} /></div>
            <div className="space-y-1"><Label>Mother's Name</Label><Input onChange={e => setFormData({...formData, motherName: e.target.value})} /></div>
        </>}
        {selectedCert === 'death' && <>
            <div className="space-y-1"><Label>Date of Death</Label><Input type="date" onChange={e => setFormData({...formData, dod: e.target.value})} /></div>
            <div className="space-y-1"><Label>Cause of Death</Label><Input onChange={e => setFormData({...formData, cause: e.target.value})} /></div>
        </>}
        {selectedCert === 'discharge' && <>
            <div className="space-y-1"><Label>Date of Admission</Label><Input type="date" onChange={e => setFormData({...formData, doa: e.target.value})} /></div>
            <div className="space-y-1"><Label>Date of Discharge</Label><Input type="date" onChange={e => setFormData({...formData, dodischarge: e.target.value})} /></div>
        </>}
        {selectedCert === 'police' && <>
            <div className="space-y-1"><Label>Incident Date</Label><Input type="date" onChange={e => setFormData({...formData, incidentDate: e.target.value})} /></div>
            <div className="col-span-full space-y-1"><Label>Details of Incident</Label><Textarea onChange={e => setFormData({...formData, details: e.target.value})} /></div>
        </>}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Certificate Generation</h1>
        <p className="text-sm text-muted-foreground">Generate official clinic documents and reports.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Generator Tool</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>1. Select Patient</Label>
              <Select onValueChange={handlePatientChange} disabled={loading}>
                <SelectTrigger><SelectValue placeholder={loading ? "Loading..." : "Choose a patient..."} /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>2. Select Certificate Type</Label>
              <Select onValueChange={setSelectedCert} disabled={!selectedPatient}>
                <SelectTrigger><SelectValue placeholder={!selectedPatient ? "Select a patient first" : "Choose a certificate..."} /></SelectTrigger>
                <SelectContent>{certificateTypes.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {renderFormFields()}
        </CardContent>
      </Card>
      
      {renderCertificatePreview()}
    </div>
  );
}
