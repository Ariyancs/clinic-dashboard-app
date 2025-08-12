import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import Pages
import Index from "./pages/Index";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports"; // This is now the Certificate page
import Departments from "./pages/Doctors";
import MedicalRecords from "./pages/MedicalRecords"; // This is for patient history
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Import our Protected Layout
import MainLayout from "./layouts/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/reports" element={<Reports />} /> {/* <-- THIS IS NOW CORRECT */}
            <Route path="/departments" element={<Departments />} />
            <Route path="/records" element={<MedicalRecords />} /> {/* <-- THIS IS ALSO CORRECT */}
            <Route path="/schedules" element={<Appointments />} />
            <Route path="/settings" element={<Index />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;