import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Skeleton } from "./ui/skeleton";

type QueueEntry = {
  id: string;
  appointment_time: string;
  patients: { full_name: string } | null;
  notes: string | null;
};

export function PatientQueue() {
  const [queueData, setQueueData] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_time, notes, patients(full_name)')
        .gte('appointment_time', todayStart)
        .lte('appointment_time', todayEnd)
        .order('appointment_time', { ascending: true })
        .limit(5);

      if (error) {
        console.error("Failed to load patient queue:", error);
      } else {
        setQueueData(data || []);
      }
      setLoading(false);
    };

    fetchQueue();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Today's Patient Queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : queueData.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No appointments scheduled for today.</p>
        ) : (
          queueData.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">{item.patients?.full_name || 'Unknown Patient'}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.notes || 'No notes'}</p>
                </div>
              </div>
              <div className="font-mono text-sm font-medium">
                {format(parseISO(item.appointment_time), 'p')}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}