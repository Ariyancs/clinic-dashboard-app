import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import DoctorSchedules from "./pages/DoctorSchedules";
import Doctors from "./pages/Doctors";
import MedicalRecords from "./pages/MedicalRecords";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/schedules" element={<DoctorSchedules />} />
            
            {/* THIS IS THE FIX: Both routes now point to the same component */}
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/departments" element={<Doctors />} /> 
            
            <Route path="/records" element={<MedicalRecords />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
