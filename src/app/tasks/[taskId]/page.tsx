"use client";

import { use, useState } from "react";
import { Camera, MessageSquare, Pencil, RotateCcw, Save, Trash2, X } from "lucide-react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { TaskEditControls } from "@/components/forms";
import { Button, Card, EmptyState, PageHeader, PriorityBadge, StatusBadge, UserPill } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import { formatDate } from "@/lib/utils";
import type { AppData, Task } from "@/lib/types";

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  const { data, addComment, addTaskImages, deleteTaskImage, reopenTask, updateTask } = useAppData();
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState("");
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
      <PageHeader
        title={task.title}
        kicker={`${category?.name ?? ""} / ${subcategory?.name ?? ""}`}
        actions={
          <Button className={isEditing ? "bg-slate-600 hover:bg-slate-700" : "bg-blueprint hover:bg-blue-700"} onClick={() => setIsEditing((current) => !current)}>
            {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {isEditing ? "Hætta við" : "Breyta"}
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          <Card>
            {isEditing ? (
              <TaskEditForm
                data={data}
                task={task}
                onCancel={() => setIsEditing(false)}
                onSave={(patch) => {
                  updateTask(task.id, patch);
                  setIsEditing(false);
                }}
              />
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <UserPill name={assignee?.name} />
                </div>
                <p className="mt-4 whitespace-pre-wrap text-slate-700">{task.description || "Engin lýsing skráð."}</p>
              </>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-bold"><Camera className="h-4 w-4" /> Myndir</h2>
            <label className="touch-target mb-4 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
              {isUploadingImages ? "Vista myndir..." : "Bæta við myndum"}
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                disabled={isUploadingImages}
                onChange={async (event) => {
                  if (!event.target.files) return;
                  setIsUploadingImages(true);
                  try {
                    await addTaskImages(task.id, event.target.files);
                    event.target.value = "";
                  } finally {
                    setIsUploadingImages(false);
                  }
                }}
              />
            </label>
            {images.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {images.map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                    <img src={image.image_url} alt="" className="h-48 w-full bg-slate-100 object-contain" />
                    <button
                      type="button"
                      disabled={deletingImageId === image.id}
                      onClick={async () => {
                        const confirmed = window.confirm("Ertu viss um að þú viljir eyða þessari mynd?");
                        if (!confirmed) return;

                        setDeletingImageId(image.id);
                        try {
                          await deleteTaskImage(image.id);
                        } finally {
                          setDeletingImageId("");
                        }
                      }}
                      className="touch-target flex w-full items-center justify-center gap-2 border-t border-slate-200 bg-red-50 px-3 text-sm font-bold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" /> {deletingImageId === image.id ? "Eyði..." : "Eyða mynd"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Engar myndir hafa verið skráðar á þetta atriði.</p>
            )}
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

function TaskEditForm({ data, task, onSave, onCancel }: { data: AppData; task: Task; onSave: (patch: Partial<Task>) => void; onCancel: () => void }) {
  const unitCategories = data.unit_categories
    .filter((item) => item.unit_id === task.unit_id)
    .map((item) => data.categories.find((category) => category.id === item.category_id))
    .filter((category): category is NonNullable<typeof category> => Boolean(category))
    .sort((a, b) => a.sort_order - b.sort_order);
  const categories = unitCategories.length > 0 ? unitCategories : data.categories.filter((category) => category.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [categoryId, setCategoryId] = useState(task.category_id || categories[0]?.id || "");
  const unitSubcategoryLinks = data.unit_subcategories.filter((item) => item.unit_id === task.unit_id);

  function subcategoriesFor(selectedCategoryId: string) {
    const linkedSubcategories = unitSubcategoryLinks
      .filter((item) => item.category_id === selectedCategoryId)
      .map((item) => data.subcategories.find((subcategory) => subcategory.id === item.subcategory_id))
      .filter((subcategory): subcategory is NonNullable<typeof subcategory> => Boolean(subcategory))
      .sort((a, b) => a.sort_order - b.sort_order);

    if (linkedSubcategories.length > 0) return linkedSubcategories;
    return data.subcategories.filter((subcategory) => subcategory.category_id === selectedCategoryId && subcategory.is_active).sort((a, b) => a.sort_order - b.sort_order);
  }

  const subcategories = subcategoriesFor(categoryId);
  const [subcategoryId, setSubcategoryId] = useState(task.subcategory_id || subcategories[0]?.id || "");
  const [assignedToUserId, setAssignedToUserId] = useState(task.assigned_to_user_id ?? "");

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const nextSubcategoryId = subcategories.some((subcategory) => subcategory.id === subcategoryId) ? subcategoryId : subcategories[0]?.id ?? "";
        if (!title.trim() || !categoryId || !nextSubcategoryId) return;
        onSave({
          title: title.trim(),
          description: description.trim(),
          category_id: categoryId,
          subcategory_id: nextSubcategoryId,
          assigned_to_user_id: assignedToUserId || undefined
        });
      }}
    >
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Titill
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="touch-target rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Lýsing
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Flokkur
          <select
            value={categoryId}
            onChange={(event) => {
              const nextCategoryId = event.target.value;
              const nextSubcategories = subcategoriesFor(nextCategoryId);
              setCategoryId(nextCategoryId);
              setSubcategoryId(nextSubcategories[0]?.id ?? "");
            }}
            className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
            required
          >
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Undirflokkur
          <select
            value={subcategoryId}
            onChange={(event) => setSubcategoryId(event.target.value)}
            className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
            required
          >
            {subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Úthlutun á
        <select
          value={assignedToUserId}
          onChange={(event) => setAssignedToUserId(event.target.value)}
          className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
        >
          <option value="">Óúthlutað</option>
          {data.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
        </select>
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button disabled={!title.trim() || !categoryId || subcategories.length === 0}><Save className="h-4 w-4" /> Vista breytingar</Button>
        <Button type="button" className="bg-slate-600 hover:bg-slate-700" onClick={onCancel}><X className="h-4 w-4" /> Hætta við</Button>
      </div>
    </form>
  );
}
