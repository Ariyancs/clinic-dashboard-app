import { useState, useEffect } from "react";
import { Users, Calendar, BedDouble, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { QuickActions } from "@/components/QuickActions";
import { PatientQueue } from "@/components/PatientQueue";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns";

export default function Index() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todaysAppointments: 0,
    availableBeds: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const todayStart = startOfDay(new Date()).toISOString();
        const todayEnd = endOfDay(new Date()).toISOString();
        const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

        const [
          { count: patientCount, error: patientError },
          { count: apptCount, error: apptError },
          { count: bedCount, error: bedError },
          { data: revenueData, error: revenueError },
        ] = await Promise.all([
          supabase.from('patients').select('*', { count: 'exact', head: true }),
          supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_type', 'OPD').gte('appointment_time', todayStart).lte('appointment_time', todayEnd),
          supabase.from('beds').select('*', { count: 'exact', head: true }).eq('is_occupied', false),
          supabase.from('invoices').select('net_amount').eq('status', 'Paid').gte('invoice_date', monthStart).lte('invoice_date', monthEnd)
        ]);
        
        if (patientError || apptError || bedError || revenueError) {
            throw new Error(patientError?.message || apptError?.message || bedError?.message || revenueError?.message || "An error occurred fetching dashboard data");
        }

        const totalRevenue = revenueData?.reduce((sum, inv) => sum + inv.net_amount, 0) || 0;
        
        setStats({
          totalPatients: patientCount || 0,
          todaysAppointments: apptCount || 0,
          availableBeds: bedCount || 0,
          monthlyRevenue: totalRevenue,
        });

      } catch (error: any) {
        toast.error("Dashboard Load Failed", { description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Srijoni Healing Home Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's a real-time overview of your clinic's activities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Total Patients" value={stats.totalPatients} icon={Users} loading={loading} gradient />
        <StatsCard title="Today's OPD Appointments" value={stats.todaysAppointments} icon={Calendar} loading={loading} />
        <StatsCard title="Revenue This Month" value={`₹${stats.monthlyRevenue.toLocaleString('en-IN')}`} icon={TrendingUp} loading={loading} />
        <StatsCard title="Available Beds" value={stats.availableBeds} icon={BedDouble} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PatientQueue />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
