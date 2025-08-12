import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  loading: boolean;
  gradient?: boolean;
}

export function StatsCard({ title, value, icon: Icon, loading, gradient = false }: StatsCardProps) {
  return (
    <Card className={cn(gradient && "bg-gradient-soft border-0 shadow-card")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold text-primary">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}