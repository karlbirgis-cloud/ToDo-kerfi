"use client";

import Link from "next/link";
import { Camera, Check, MessageSquare, MoreHorizontal } from "lucide-react";
import { Card, PriorityBadge, StatusBadge, UserPill } from "./ui";
import { formatDate, getTaskResponsiblePartyName } from "@/lib/utils";
import type { AppData, Task } from "@/lib/types";

export function TaskCard({ task, data, onDone }: { task: Task; data: AppData; onDone?: () => void }) {
  const assigneeName = getTaskResponsiblePartyName(data, task);
  const comments = data.task_comments.filter((comment) => comment.task_id === task.id).length;
  const image = data.task_images.find((item) => item.task_id === task.id);
  return (
    <Card className="overflow-hidden p-0">
      {image ? (
        <a href={image.image_url} target="_blank" rel="noopener noreferrer" title="Opna mynd í nýjum glugga" className="block">
          <img src={image.image_url} alt="" className="h-36 w-full bg-slate-100 object-contain transition hover:opacity-90" />
        </a>
      ) : null}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/tasks/${task.id}`} className="font-bold text-ink hover:text-blueprint">{task.title}</Link>
          <MoreHorizontal className="h-5 w-5 shrink-0 text-slate-400" />
        </div>
        {task.description ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{task.description}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <UserPill name={assigneeName} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Skiladagur: {formatDate(task.due_date)}</span>
          <span className="flex items-center gap-3"><span className="flex items-center gap-1"><Camera className="h-3.5 w-3.5" /> {data.task_images.filter((item) => item.task_id === task.id).length}</span><span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {comments}</span></span>
        </div>
        {task.status !== "done" && onDone ? (
          <button onClick={onDone} className="touch-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
            <Check className="h-4 w-4" /> Merkja lokið
          </button>
        ) : null}
      </div>
    </Card>
  );
}
