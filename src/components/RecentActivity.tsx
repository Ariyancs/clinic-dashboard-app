import { Clock, UserCheck, Calendar, FileText, Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const activities = [
  {
    id: 1,
    type: "appointment",
    title: "New appointment scheduled",
    description: "Patient: John Doe - Dr. Smith",
    time: "5 minutes ago",
    icon: Calendar,
    status: "scheduled"
  },
  {
    id: 2,
    type: "patient",
    title: "Patient admitted",
    description: "Emergency admission - Room 204",
    time: "12 minutes ago",
    icon: UserCheck,
    status: "admitted"
  },
  {
    id: 3,
    type: "record",
    title: "Medical record updated",
    description: "Patient: Sarah Wilson - Lab results",
    time: "1 hour ago",
    icon: FileText,
    status: "updated"
  },
  {
    id: 4,
    type: "pharmacy",
    title: "Prescription filled",
    description: "Patient: Mike Johnson - Antibiotics",
    time: "2 hours ago",
    icon: Pill,
    status: "completed"
  }
];

const statusColors = {
  scheduled: "bg-primary text-primary-foreground",
  admitted: "bg-accent text-accent-foreground",
  updated: "bg-warning text-warning-foreground",
  completed: "bg-secondary text-secondary-foreground"
};

export function RecentActivity() {
  return (
    <Card className="bg-gradient-card shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <activity.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <Badge 
                    variant="secondary" 
                    className={statusColors[activity.status as keyof typeof statusColors]}
                  >
                    {activity.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}