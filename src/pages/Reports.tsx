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
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";

// --- Type Definitions now match your database EXACTLY ---
type Patient = {
  id: string;
  full_name: string;
  dob: string | null;
  phone: string | null;
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
      // CORRECTED QUERY: Selects only the columns that exist in your table.
      const { data, error } = await supabase.from('patients').select('id, full_name, dob, phone');
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
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-area')?.innerHTML;
    if (printContent) {
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = `<html><head><title>Print Certificate</title></head><body>${printContent}</body></html>`;
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
        <CardHeader><CardTitle>Certificate Preview</CardTitle></CardHeader>
        <CardContent>
            <div id="printable-area" className="border rounded-lg p-8">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold">Srijoni Healing Home</h1>
                  <h2 className="text-xl font-semibold mt-4 underline">{certLabel}</h2>
                </div>
                
                <div className="space-y-4 text-lg">
                  <p><strong>Patient Name:</strong> {selectedPatient.full_name}</p>
                  <p><strong>Date of Birth:</strong> {selectedPatient.dob ? format(parseISO(selectedPatient.dob), 'PPP') : 'N/A'}</p>
                  <p><strong>Contact Phone:</strong> {selectedPatient.phone || 'N/A'}</p>

                  {selectedCert === 'birth' && <>
                    <p><strong>Father's Name:</strong> {formData.fatherName || '________________'}</p>
                  </>}
                  {selectedCert === 'death' && <>
                    <p><strong>Date of Death:</strong> {formData.dod || '________________'}</p>
                    <p><strong>Cause of Death:</strong> {formData.cause || '________________'}</p>
                  </>}
                  {selectedCert === 'discharge' && <>
                    <p><strong>Date of Admission:</strong> {formData.doa || '________________'}</p>
                    <p><strong>Date of Discharge:</strong> {formData.dodischarge || '________________'}</p>
                  </>}
                   {selectedCert === 'police' && <>
                    <p><strong>Incident Date:</strong> {formData.incidentDate || '________________'}</p>
                    <p><strong>Details:</strong> {formData.details || '________________'}</p>
                  </>}
                </div>
                <div className="mt-16 text-right">
                  <p>_________________________</p>
                  <p>Authorized Signature</p>
                </div>
            </div>
            <div className="text-right mt-4">
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Certificate</Button>
            </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderFormFields = () => {
    if (!selectedCert) return null;
    
    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        {selectedCert === 'birth' && <>
            <div className="space-y-1"><Label>Father's Name</Label><Input onChange={e => setFormData({...formData, fatherName: e.target.value})} /></div>
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
            <div className="col-span-2 space-y-1"><Label>Details of Incident</Label><Textarea onChange={e => setFormData({...formData, details: e.target.value})} /></div>
        </>}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl font-bold">Certificate Generation</h1><p className="text-muted-foreground">Generate official clinic documents.</p></div>
      <Card>
        <CardHeader><CardTitle>Generator Tool</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Select Patient</Label>
              <Select onValueChange={handlePatientChange} disabled={loading}>
                <SelectTrigger><SelectValue placeholder={loading ? "Loading..." : "Choose a patient..."} /></SelectTrigger>
                <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Select Certificate Type</Label>
              <Select onValueChange={setSelectedCert}>
                <SelectTrigger><SelectValue placeholder="Choose a certificate..." /></SelectTrigger>
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