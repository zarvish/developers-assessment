import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useEffect } from "react"

const API_URL = "http://localhost:8000"

export const Route = createFileRoute("/_layout/worklogs/$wlId")({
  component: WorklogDetailPage,
  head: () => ({
    meta: [{ title: "Worklog Detail - Payment Dashboard" }],
  }),
})

async function fetchWorklogDetail(id: string) {
  const token = localStorage.getItem("access_token")
  const resp = await fetch(`${API_URL}/api/v1/worklogs/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok) throw new Error("Failed to fetch worklog detail")
  return resp.json()
}

function WorklogDetailPage() {
  const { wlId } = Route.useParams()
  const [wl, setWl] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchWorklogDetail(wlId)
      .then(setWl)
      .catch((err) => {
        setError("Failed to load worklog. Please try again.")
        console.error(err)
      })
      .finally(() => setIsLoading(false))
  }, [wlId])

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )

  if (error)
    return (
      <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    )

  if (!wl) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to="/worklogs"
          className="text-sm text-muted-foreground hover:text-foreground"
          aria-label="Back to worklogs list"
        >
          ← Worklogs
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{wl.task_name}</span>
      </div>

      {/* Header */}
      <div className="rounded-lg border p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{wl.task_name}</h1>
            <p className="text-muted-foreground mt-1">
              {wl.freelancer_name} &middot; {wl.freelancer_email}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              wl.status === "paid"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            }`}
          >
            {wl.status}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-md bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Rate / hr
            </p>
            <p className="text-xl font-bold mt-1">
              ${wl.hourly_rate.toFixed(2)}
            </p>
          </div>
          <div className="rounded-md bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Hours
            </p>
            <p className="text-xl font-bold mt-1">
              {wl.total_hours.toFixed(1)}h
            </p>
          </div>
          <div className="rounded-md bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Earned
            </p>
            <p className="text-xl font-bold mt-1 text-primary">
              ${wl.total_earned.toFixed(2)}
            </p>
          </div>
          <div className="rounded-md bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Created
            </p>
            <p className="text-sm font-medium mt-1">{wl.created_at}</p>
          </div>
        </div>
      </div>

      {/* Time Entries */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Time Entries ({wl.entries?.length ?? 0})
        </h2>
        {wl.entries && wl.entries.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No time entries recorded.
          </p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Hours</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {wl.entries?.map((e: any, i: number) => (
                  <tr
                    key={e.id}
                    className={`border-t ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.entry_date}
                    </td>
                    <td className="px-4 py-3">{e.description}</td>
                    <td className="px-4 py-3 text-right">{e.hours.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right">
                      ${(e.hours * wl.hourly_rate).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right font-semibold">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {wl.total_hours.toFixed(1)}h
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-primary">
                    ${wl.total_earned.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
