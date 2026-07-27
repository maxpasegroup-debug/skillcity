import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type NotificationView = {
  id: string;
  title: string;
  message: string;
  status: "UNREAD" | "READ" | "ARCHIVED";
};

export function NotificationCard({ notification }: { notification: NotificationView }) {
  return (
    <Card>
      <CardContent className="flex gap-4 p-5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-brand-dark">{notification.title}</h3>
          <p className="mt-2 text-base leading-7 text-brand-muted">{notification.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
