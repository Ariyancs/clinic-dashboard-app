import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- Type Definitions ---
type Patient = { id: string; full_name: string; registration_no: string; };
type Doctor = { id: string; name: string; };

type Invoice = {
  id: string;
  invoice_no: string;
  invoice_date: string;
  net_amount: number;
  due_amount: number;
  status: string;
  patients: { full_name: string; } | null;
};

type InvoiceItem = {
    test_name: string;
    quantity: number;
    unit_price: number;
};

type InvoiceWithDetails = {
    id: string;
    invoice_no: string;
    invoice_date: string;
    net_amount: number;
    due_amount: number;
    status: string;
    patients: { full_name: string; address: string | null; } | null;
    invoice_items: InvoiceItem[];
    gross_amount: number;
    service_charge: number;
    discount: number;
    collection_charge: number;
    round_off: number;
    paid_amount: number;
    referred_by: string | null;
    collector_name: string | null;
    lab_name: string | null;
    payment_method: string;
    report_id: string | null;
    doctors: { name: string } | null;
};

const getStatusColor = (status: string) => {
  if (status === "Paid") return "bg-green-500 text-white hover:bg-green-600";
  if (status === "Due") return "bg-yellow-500 text-white hover:bg-yellow-600";
  return "bg-secondary text-secondary-foreground";
};

const initialFormState = {
  patient_id: "",
  items: [{ test_name: "", qty: 1, rate: 0, amount: 0 }],
  service_charge: 0,
  discount: 0,
  collection_charge: 0,
  paid_amount: 0,
  referred_by: "",
  collector_name: "",
  lab_name: "",
  payment_method: "Cash",
  report_id: "",
};

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [formState, setFormState] = useState(initialFormState);

  const calculatedValues = useMemo(() => {
    const gross_amount = formState.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.rate)), 0);
    const amountAfterCharges = gross_amount + Number(formState.service_charge) + Number(formState.collection_charge);
    const amountAfterDiscount = amountAfterCharges - Number(formState.discount);
    const net_amount = Math.round(amountAfterDiscount);
    const round_off = net_amount - amountAfterDiscount;
    const due_amount = net_amount - Number(formState.paid_amount);
    return { gross_amount, net_amount, round_off, due_amount };
  }, [formState]);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [patientResult, invoiceResult, doctorResult] = await Promise.all([
                supabase.from('patients').select('id, full_name, registration_no').order('full_name'),
                supabase.from('invoices').select(`*, patients(full_name)`).order('created_at', { ascending: false }),
                supabase.from('doctors').select('id, name').order('name')
            ]);
            if (patientResult.error) throw patientResult.error;
            setPatients(patientResult.data || []);
            if (invoiceResult.error) throw invoiceResult.error;
            setInvoices(invoiceResult.data || []);
            if (doctorResult.error) throw doctorResult.error;
            setDoctors(doctorResult.data || []);
        } catch (error: any) {
            toast.error("Failed to load page data.", { description: error.message });
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);
  
  const handlePatientSelect = (patientId: string) => {
    const selectedPatient = patients.find(p => p.id === patientId);
    if (selectedPatient) {
        setFormState({
            ...formState,
            patient_id: selectedPatient.id,
            report_id: selectedPatient.registration_no,
        });
    }
  };

  const handleItemChange = (index: number, field: keyof typeof formState.items[0], value: any) => {
    const updatedItems = [...formState.items];
    const item = { ...updatedItems[index], [field]: value };
    item.amount = Number(item.qty) * Number(item.rate);
    updatedItems[index] = item;
    setFormState(prev => ({ ...prev, items: updatedItems }));
  };

  const handleAddItem = () => setFormState(prev => ({ ...prev, items: [...prev.items, { test_name: "", qty: 1, rate: 0, amount: 0 }] }));
  const handleRemoveItem = (index: number) => setFormState(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const handleCreateInvoice = async () => {
    if (!formState.patient_id) return toast.error("Please select a patient.");
    if (formState.items.some(item => !item.test_name.trim() || Number(item.rate) <= 0 || Number(item.qty) <= 0)) {
        return toast.error("All items must have a Test Name, and Rate/Qty greater than zero.");
    }
    const { due_amount, gross_amount, net_amount, round_off } = calculatedValues;
    const referredByValue = formState.referred_by === "" ? null : formState.referred_by;
    const invoiceData = {
      patient_id: formState.patient_id,
      gross_amount, net_amount, round_off, due_amount,
      service_charge: formState.service_charge,
      discount: formState.discount,
      collection_charge: formState.collection_charge,
      paid_amount: formState.paid_amount,
      referred_by: referredByValue,
      collector_name: formState.collector_name,
      lab_name: formState.lab_name,
      payment_method: formState.payment_method,
      report_id: formState.report_id,
      status: due_amount > 0 ? 'Due' : 'Paid',
    };
    const { data: invData, error: invErr } = await supabase.from('invoices').insert(invoiceData).select('*, patients(full_name)').single();
    if (invErr) return toast.error("Failed to create invoice.", { description: invErr.message });
    
    // *** THIS IS THE FIX ***
    // The column is 'test_name', not 'description'.
    const itemsToInsert = formState.items.map(item => ({ 
        invoice_id: invData.id, 
        test_name: item.test_name, 
        quantity: item.qty, 
        unit_price: item.rate, 
        actual_rate: item.rate, 
        item_discount_amount: 0, 
        commission_percentage: 0, 
        commission_amount: 0 
    }));
    const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsToInsert);
    if (itemsErr) {
      toast.error("Invoice created, but failed to add items.", { description: itemsErr.message });
    } else {
      toast.success(`Invoice ${invData.invoice_no} created successfully!`);
      setInvoices(prev => [invData, ...prev]);
      setIsCreateOpen(false);
      setFormState(initialFormState);
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    // *** THIS IS THE FIX ***
    // Select 'test_name' from invoice_items, not 'description'.
    const { data, error } = await supabase.from('invoices').select(`*, patients(full_name, address), invoice_items(test_name, quantity, unit_price), doctors:referred_by(name)`).eq('id', invoiceId).single();
    if (error) {
      toast.error("Failed to fetch invoice details.", { description: error.message });
    } else {
      setSelectedInvoice(data as InvoiceWithDetails);
      setIsViewOpen(true);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printableInvoice')?.innerHTML;
    if (printContent) {
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = `<div class="print-container">${printContent}</div>`;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Investigation Billing</h1>
          <p className="text-sm text-muted-foreground">Create and manage outdoor investigation bills.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> New Bill</Button></DialogTrigger>
          <DialogContent className="max-w-6xl">
            <DialogHeader><DialogTitle>Investigation Bill - Outdoor</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 border rounded-lg">
              <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
                <div>
                  <Label>Patient</Label>
                  <Select onValueChange={handlePatientSelect}>
                    <SelectTrigger><SelectValue placeholder="Select Patient..." /></SelectTrigger>
                    <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name} ({p.registration_no})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Report ID</Label>
                  <Input value={formState.report_id} readOnly disabled placeholder="Auto-filled"/>
                </div>
              </div>
              <div className="lg:col-span-9">
                <div className="h-64 overflow-y-auto border">
                  <Table>
                    <TableHeader><TableRow><TableHead className="w-[5%]">No.</TableHead><TableHead className="w-[40%]">Test Name</TableHead><TableHead>Qty</TableHead><TableHead>Rate</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {formState.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell><Input className="h-8" value={item.test_name} onChange={e => handleItemChange(index, 'test_name', e.target.value)} /></TableCell>
                          <TableCell><Input className="h-8 w-16" type="number" value={item.qty} onChange={e => handleItemChange(index, 'qty', Number(e.target.value))} /></TableCell>
                          <TableCell><Input className="h-8 w-24" type="number" value={item.rate} onChange={e => handleItemChange(index, 'rate', Number(e.target.value))} /></TableCell>
                          <TableCell className="text-right font-medium">${item.amount.toFixed(2)}</TableCell>
                          <TableCell><Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleRemoveItem(index)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2"><Plus className="mr-2 h-4 w-4" /> Add Test</Button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 border-t pt-4">
                  <div><Label>Referred By</Label><Select onValueChange={v => setFormState({...formState, referred_by: v})}><SelectTrigger><SelectValue placeholder="Select Doctor..." /></SelectTrigger><SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Collector Name</Label><Input value={formState.collector_name} onChange={e => setFormState({...formState, collector_name: e.target.value})} /></div>
                  <div><Label>Lab Name</Label><Input value={formState.lab_name} onChange={e => setFormState({...formState, lab_name: e.target.value})} /></div>
                </div>
              </div>
              <div className="lg:col-span-3 space-y-2 rounded-lg bg-secondary p-4">
                <RadioGroup defaultValue="Cash" className="flex" onValueChange={v => setFormState({...formState, payment_method: v})}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Cash" id="cash" /><Label htmlFor="cash">Cash</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="Credit" id="credit" /><Label htmlFor="credit">Credit</Label></div>
                </RadioGroup>
                <Separator />
                <div className="flex justify-between text-sm"><span>Gross Amount</span><span className="font-semibold">${calculatedValues.gross_amount.toFixed(2)}</span></div>
                <div className="grid grid-cols-2 items-center"><Label className="text-sm">Srv. Chrg</Label><Input type="number" className="h-8" value={formState.service_charge} onChange={e => setFormState({...formState, service_charge: Number(e.target.value)})} /></div>
                <div className="grid grid-cols-2 items-center"><Label className="text-sm">Discount</Label><Input type="number" className="h-8" value={formState.discount} onChange={e => setFormState({...formState, discount: Number(e.target.value)})} /></div>
                <div className="grid grid-cols-2 items-center"><Label className="text-sm">Coll. Chrg</Label><Input type="number" className="h-8" value={formState.collection_charge} onChange={e => setFormState({...formState, collection_charge: Number(e.target.value)})} /></div>
                <div className="flex justify-between text-sm"><span>Round Off</span><span className="font-semibold">${calculatedValues.round_off.toFixed(2)}</span></div>
                <Separator/>
                <div className="flex justify-between font-bold text-lg"><span>Net Amount</span><span>${calculatedValues.net_amount.toFixed(2)}</span></div>
                <div className="grid grid-cols-2 items-center"><Label className="text-sm">Paid Amount</Label><Input type="number" className="h-8" value={formState.paid_amount} onChange={e => setFormState({...formState, paid_amount: Number(e.target.value)})} /></div>
                <Separator/>
                <div className="flex justify-between font-bold text-lg text-destructive"><span>Due Amount</span><span>${calculatedValues.due_amount.toFixed(2)}</span></div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); setFormState(initialFormState); }}>Cancel</Button>
              <Button onClick={handleCreateInvoice}>Save & Generate Bill</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Generated Bills</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Patient</TableHead><TableHead>Net Amount</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={7} className="text-center py-10">Loading...</TableCell></TableRow>}
                {!loading && invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs">{invoice.invoice_no}</TableCell>
                    <TableCell>{format(parseISO(invoice.invoice_date), "PPP")}</TableCell>
                    <TableCell>{invoice.patients?.full_name ?? 'N/A'}</TableCell>
                    <TableCell>${Number(invoice.net_amount).toFixed(2)}</TableCell>
                    <TableCell className="text-destructive font-medium">${Number(invoice.due_amount).toFixed(2)}</TableCell>
                    <TableCell><Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice.id)}><FileText className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
            <div id="printableInvoice">
                <DialogHeader className="text-center mb-6">
                    <h2 className="text-2xl font-bold">Srijoni Healing Home</h2>
                    <DialogTitle className="text-3xl font-bold tracking-tight">INVESTIGATION BILL</DialogTitle>
                    <DialogDescription>
                        Patient: {selectedInvoice?.patients?.full_name || 'N/A'} <br/>
                        Address: {selectedInvoice?.patients?.address || 'N/A'} <br/>
                        Bill No: {selectedInvoice?.invoice_no} | Date: {selectedInvoice && format(parseISO(selectedInvoice.invoice_date), "PPP")}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Table>
                        <TableHeader><TableRow><TableHead>Test Name</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {selectedInvoice?.invoice_items.map((item, index) => (
                            // *** THIS IS THE FIX ***
                            // Use 'test_name' here, not 'description'.
                            <TableRow key={index}><TableCell>{item.test_name}</TableCell><TableCell className="text-center">{item.quantity}</TableCell><TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell><TableCell className="text-right">${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</TableCell></TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 gap-x-8">
                        <div>
                            <p className="text-sm"><strong>Referred By:</strong> Dr. {selectedInvoice?.doctors?.name || 'N/A'}</p>
                            <p className="text-sm"><strong>Collector:</strong> {selectedInvoice?.collector_name || 'N/A'}</p>
                        </div>
                        <div className="text-right space-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Gross Amount:</span><span>${(selectedInvoice?.gross_amount || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Service Charge:</span><span>${(selectedInvoice?.service_charge || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Discount:</span><span>-${(selectedInvoice?.discount || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Collection Charge:</span><span>${(selectedInvoice?.collection_charge || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Round Off:</span><span>${(selectedInvoice?.round_off || 0).toFixed(2)}</span></div>
                            <Separator className="my-1"/>
                            <div className="flex justify-between font-bold text-base"><span>Net Amount:</span><span>${(selectedInvoice?.net_amount || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Paid Amount:</span><span>${(selectedInvoice?.paid_amount || 0).toFixed(2)}</span></div>
                            <Separator className="my-1"/>
                            <div className="flex justify-between font-bold text-lg text-destructive"><span>Due Amount:</span><span>${(selectedInvoice?.due_amount || 0).toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
            <DialogFooter className="no-print justify-between mt-6">
                <div></div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                    <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print Bill</Button>
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
