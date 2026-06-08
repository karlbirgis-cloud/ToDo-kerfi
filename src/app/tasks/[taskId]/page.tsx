"use client";

import { use, useState } from "react";
import { Camera, MessageSquare, RotateCcw, Save } from "lucide-react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { TaskEditControls } from "@/components/forms";
import { Button, Card, EmptyState, PageHeader, PriorityBadge, StatusBadge, UserPill } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import { formatDate } from "@/lib/utils";

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  const { data, addComment, addTaskImages, reopenTask } = useAppData();
  const [comment, setComment] = useState("");
  const task = data.tasks.find((item) => item.id === taskId);
  if (!task) return <AppShell><EmptyState title="Atriði fannst ekki" body="Atriðið gæti hafa verið eytt." /></AppShell>;
  const project = data.projects.find((item) => item.id === task.project_id);
  const location = data.locations.find((item) => item.id === task.location_id);
  const unit = data.units.find((item) => item.id === task.unit_id);
  const category = data.categories.find((item) => item.id === task.category_id);
  const subcategory = data.subcategories.find((item) => item.id === task.subcategory_id);
  const assignee = data.profiles.find((profile) => profile.id === task.assigned_to_user_id);
  const creator = data.profiles.find((profile) => profile.id === task.created_by_user_id);
  const images = data.task_images.filter((image) => image.task_id === task.id);
  const comments = data.task_comments.filter((item) => item.task_id === task.id);
  const history = data.task_status_history.filter((item) => item.task_id === task.id);
  return (
    <AppShell>
      <Breadcrumbs items={[
        { label: project?.full_name ?? "Verkefni", href: task.project_id ? `/projects/${task.project_id}` : undefined },
        { label: location?.name ?? "Gata", href: `/projects/${task.project_id}/locations/${task.location_id}` },
        { label: unit?.name ?? "Rými", href: `/projects/${task.project_id}/locations/${task.location_id}/units/${task.unit_id}` },
        { label: task.title }
      ]} />
      <PageHeader title={task.title} kicker={`${category?.name ?? ""} / ${subcategory?.name ?? ""}`} />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          <Card>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <UserPill name={assignee?.name} />
            </div>
            <p className="mt-4 whitespace-pre-wrap text-slate-700">{task.description || "Engin lýsing skráð."}</p>
          </Card>
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-bold"><Camera className="h-4 w-4" /> Myndir</h2>
            <label className="touch-target mb-4 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
              Bæta við myndum
              <input className="sr-only" type="file" accept="image/*" capture="environment" multiple onChange={(event) => event.target.files && addTaskImages(task.id, event.target.files)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((image) => <img key={image.id} src={image.image_url} alt="" className="h-48 w-full rounded-md object-cover" />)}
            </div>
          </Card>
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-bold"><MessageSquare className="h-4 w-4" /> Athugasemdir</h2>
            <form className="mb-4 grid gap-2" onSubmit={(event) => { event.preventDefault(); if (comment.trim()) addComment(task.id, comment.trim()); setComment(""); }}>
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} className="rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" placeholder="Skrifa athugasemd" />
              <Button><Save className="h-4 w-4" /> Vista athugasemd</Button>
            </form>
            <div className="grid gap-3">
              {comments.map((item) => {
                const user = data.profiles.find((profile) => profile.id === item.user_id);
                return <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm"><p className="font-semibold">{user?.name}</p><p className="mt-1 text-slate-700">{item.comment}</p><p className="mt-2 text-xs text-slate-500">{formatDate(item.created_at)}</p></div>;
              })}
            </div>
          </Card>
        </section>
        <aside className="grid content-start gap-4">
          <Card>
            <h2 className="mb-4 font-bold">Upplýsingar</h2>
            <Info label="Verkefni" value={project?.full_name} />
            <Info label="Gata" value={location?.name} />
            <Info label="Íbúð / rými" value={unit?.name} />
            <Info label="Stofnað af" value={creator?.name} />
            <Info label="Stofnað" value={formatDate(task.created_at)} />
            <Info label="Skiladagur" value={formatDate(task.due_date)} />
            <Info label="Lokið" value={formatDate(task.completed_at)} />
          </Card>
          <Card>
            <h2 className="mb-4 font-bold">Aðgerðir</h2>
            <TaskEditControls taskId={task.id} currentStatus={task.status} />
            {task.status === "done" ? <Button className="mt-3 w-full bg-blueprint hover:bg-blue-700" onClick={() => reopenTask(task.id)}><RotateCcw className="h-4 w-4" /> Enduropna</Button> : null}
          </Card>
          <Card>
            <h2 className="mb-3 font-bold">Stöðusaga</h2>
            <div className="grid gap-2 text-sm text-slate-600">
              {history.length === 0 ? <p>Engar stöðubreytingar enn.</p> : history.map((item) => <p key={item.id}>{formatDate(item.created_at)}: {item.old_status} → {item.new_status}</p>)}
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div className="border-b border-slate-100 py-2 text-sm"><p className="text-slate-500">{label}</p><p className="font-semibold text-ink">{value || "-"}</p></div>;
}
