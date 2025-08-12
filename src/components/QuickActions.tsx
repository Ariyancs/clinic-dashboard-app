import { useNavigate } from "react-router-dom";
import { UserPlus, Calendar, Building2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Individual Action Button component for better structure
const ActionButton = ({ title, description, icon: Icon, onClick }: any) => (
  <Button
    variant="outline"
    className="h-auto p-4 flex flex-col items-center justify-center text-center gap-2 hover:bg-secondary transition-all duration-200"
    onClick={onClick}
  >
    <Icon className="h-5 w-5 text-primary" />
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </Button>
);

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-card shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            title="Book Appointment"
            description="Schedule patient visit"
            icon={Calendar}
            onClick={() => navigate('/appointments')}
          />
          <ActionButton
            title="Add Patient"
            description="Register new patient"
            icon={UserPlus}
            onClick={() => navigate('/patients')}
          />
          <ActionButton
            title="View Schedules"
            description="Doctor availability"
            icon={ClipboardList}
            onClick={() => navigate('/schedules')}
          />
          <ActionButton
            title="Manage Departments"
            description="Department settings"
            icon={Building2}
            onClick={() => navigate('/departments')}
          />
        </div>
      </CardContent>
    </Card>
  );
}