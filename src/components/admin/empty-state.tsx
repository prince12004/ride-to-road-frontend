import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-navy-200 bg-navy-50/50 px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-white text-navy-400 shadow-sm">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-display text-base font-bold text-navy-900">{title}</p>
        {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
