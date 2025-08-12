import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, FileText, Trash2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "@/components/ui/sonner";
import { format, parseISO } from "date-fns";

// --- Type Definitions to match your Schema ---
type Patient = { id: string; full_name: string; };
type Invoice = {
  id: string;
  invoice_date: string;
  due_date: string | null;
  total_amount: number;
  status: string;
  patients: { full_name: string; } | null;
};
type InvoiceItem = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
};
type InvoiceWithItems = Invoice & { invoice_items: InvoiceItem[] };

// --- Helper Functions ---
const getStatusColor = (status: string) => {
  switch (status) {
    case "Paid": return "bg-green-500 text-white";
    case "Sent": return "bg-blue-500 text-white";
    case "Overdue": return "bg-destructive text-destructive-foreground";
    default: return "bg-secondary text-secondary-foreground";
  }
};

// --- Main Component ---
export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithItems | null>(null);
  
  const [newInvoicePatientId, setNewInvoicePatientId] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [patientResult, invoiceResult] = await Promise.all([
          supabase.from('patients').select('id, full_name').order('full_name'),
          supabase.from('invoices').select(`*, patients(full_name)`).order('invoice_date', { ascending: false })
        ]);

        if (patientResult.error) throw patientResult.error;
        setPatients(patientResult.data || []);

        if (invoiceResult.error) throw invoiceResult.error;
        setInvoices(invoiceResult.data as Invoice[] || []);

      } catch (error: any) {
        toast.error("Failed to load billing data.", { description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Event Handlers for the "Create Invoice" form ---
  const handleAddItem = () => setInvoiceItems([...invoiceItems, { description: "", quantity: 1, unit_price: 0 }]);
  const handleRemoveItem = (index: number) => setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...invoiceItems];
    (updated[index] as any)[field] = value;
    setInvoiceItems(updated);
  };
  
  const resetCreateForm = () => {
      setNewInvoicePatientId("");
      setInvoiceItems([{ description: "", quantity: 1, unit_price: 0 }]);
  }

  const handleCreateInvoice = async () => {
    // --- ADDED VALIDATION ---
    if (!newInvoicePatientId) return toast.error("Please select a patient.");
    if (invoiceItems.some(item => !item.description.trim())) {
      return toast.error("All invoice items must have a description.");
    }

    const total_amount = invoiceItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);

    const { data: invData, error: invErr } = await supabase.from('invoices').insert({ patient_id: newInvoicePatientId, total_amount, status: 'Draft' }).select().single();
    if (invErr || !invData) {
      // Show the ACTUAL database error
      return toast.error("Failed to create invoice.", { description: invErr.message });
    }

    const itemsToInsert = invoiceItems.map(item => ({ invoice_id: invData.id, ...item }));
    const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsToInsert);

    if (itemsErr) {
      toast.error("Invoice created, but failed to add items.", { description: itemsErr.message });
    } else {
      toast.success("Invoice created successfully!");
      const newInvoiceWithPatient = { ...invData, patients: patients.find(p => p.id === newInvoicePatientId) || null };
      setInvoices(prev => [newInvoiceWithPatient as Invoice, ...prev]);
      setIsCreateOpen(false);
      resetCreateForm();
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    const { data, error } = await supabase.from('invoices').select(`*, patients(full_name), invoice_items(*)`).eq('id', invoiceId).single();
    if (error) {
      toast.error("Failed to fetch invoice details.");
    } else {
      setSelectedInvoice(data as InvoiceWithItems);
      setIsViewOpen(true);
    }
  };
  
  const handleUpdateStatus = async (invoiceId: string, status: string) => {
      const { error } = await supabase.from('invoices').update({ status }).eq('id', invoiceId);
      if(error){
          toast.error("Failed to update status.");
      } else {
          toast.success(`Invoice status updated to ${status}`);
          setInvoices(prev => prev.map(inv => inv.id === invoiceId ? {...inv, status} : inv));
          if(selectedInvoice) setSelectedInvoice({...selectedInvoice, status});
      }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Invoices</h1>
          <p className="text-muted-foreground">Create and manage patient invoices.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button></DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Create New Invoice</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-1.5"><Label htmlFor="patient">Patient</Label>
                <Select onValueChange={setNewInvoicePatientId}>
                  <SelectTrigger disabled={patients.length === 0}><SelectValue placeholder={patients.length > 0 ? "Select a patient..." : "Loading or no patients found"} /></SelectTrigger>
                  <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Items</Label>
                {invoiceItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center"><Input placeholder="Description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="flex-1" /><Input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} className="w-20" /><Input type="number" placeholder="Price" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', Number(e.target.value))} className="w-24" /><Button variant="destructive" size="icon" onClick={() => handleRemoveItem(index)}><Trash2 className="h-4 w-4" /></Button></div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddItem}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button onClick={handleCreateInvoice}>Save Invoice</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Patient</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} className="text-center py-10">Loading...</TableCell></TableRow>}
              {!loading && invoices.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10">No invoices created yet.</TableCell></TableRow>}
              {!loading && invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{format(parseISO(invoice.invoice_date), "PPP")}</TableCell>
                  <TableCell>{invoice.patients?.full_name ?? 'N/A'}</TableCell>
                  <TableCell>${Number(invoice.total_amount).toFixed(2)}</TableCell>
                  <TableCell><Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice.id)}><FileText className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Invoice Details</DialogTitle><DialogDescription>To: {selectedInvoice?.patients?.full_name || 'N/A'} | Date: {selectedInvoice && format(parseISO(selectedInvoice.invoice_date), "PPP")}</DialogDescription></DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Qty</TableHead><TableHead>Unit Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {selectedInvoice?.invoice_items.map((item, index) => (
                  <TableRow key={index}><TableCell>{item.description}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>${Number(item.unit_price).toFixed(2)}</TableCell><TableCell className="text-right">${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right font-bold text-lg mt-4">Total: ${Number(selectedInvoice?.total_amount).toFixed(2)}</div>
          </div>
          <DialogFooter className="justify-between">
            <div className="flex items-center gap-2"><Label>Status:</Label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline">{selectedInvoice?.status}</Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(selectedInvoice!.id, 'Draft')}>Draft</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(selectedInvoice!.id, 'Sent')}>Sent</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(selectedInvoice!.id, 'Paid')}>Paid</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}