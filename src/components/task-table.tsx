"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { StatusBadge, UserPill } from "./ui";
import type { AppData, Task } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function TaskTable({ tasks, data }: { tasks: Task[]; data: AppData }) {
  const router = useRouter();

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white/90 p-8 text-center">
        <h2 className="font-bold text-ink">Engin atriði skráð</h2>
        <p className="mt-1 text-sm text-slate-600">Þegar atriði eru stofnuð fyrir þessa íbúð birtast þau hér í einum lista.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-soft">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <Th>Titill</Th>
              <Th>Lýsing</Th>
              <Th>Flokkur</Th>
              <Th>Undirflokkur</Th>
              <Th>Úthlutun á</Th>
              <Th>Staða</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const row = getTaskRow(task, data);
              return (
                <tr
                  key={task.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") router.push(`/tasks/${task.id}`);
                  }}
                  className="cursor-pointer transition hover:bg-blue-50/55 focus:bg-blue-50 focus:outline-none"
                >
                  <Td className="font-bold text-ink">{task.title}</Td>
                  <Td className="max-w-xs text-slate-600"><span className="line-clamp-2">{task.description || "-"}</span></Td>
                  <Td>{row.category}</Td>
                  <Td>{row.subcategory}</Td>
                  <Td><UserPill name={row.assignee} /></Td>
                  <Td><StatusBadge status={task.status} /></Td>
                  <Td className="text-right"><ChevronRight className="ml-auto h-4 w-4 text-slate-400" /></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {tasks.map((task) => {
          const row = getTaskRow(task, data);
          return (
            <button
              key={task.id}
              onClick={() => router.push(`/tasks/${task.id}`)}
              className="rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-ink">{task.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{task.description || "-"}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={task.status} />
                <UserPill name={row.assignee} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Detail label="Flokkur" value={row.category} />
                <Detail label="Undirflokkur" value={row.subcategory} />
                <Detail label="Skiladagur" value={formatDate(task.due_date)} />
              </dl>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getTaskRow(task: Task, data: AppData) {
  return {
    category: data.categories.find((category) => category.id === task.category_id)?.name ?? "-",
    subcategory: data.subcategories.find((subcategory) => subcategory.id === task.subcategory_id)?.name ?? "-",
    assignee: data.profiles.find((profile) => profile.id === task.assigned_to_user_id)?.name
  };
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top text-slate-700", className)}>{children}</td>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-bold text-slate-800">{value}</dd>
    </div>
  );
}
