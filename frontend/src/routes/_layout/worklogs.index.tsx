import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

const API_URL = "http://localhost:8000"

export const Route = createFileRoute("/_layout/worklogs/")({
  component: WorklogsPage,
  head: () => ({
    meta: [{ title: "Worklogs - Payment Dashboard" }],
  }),
})

async function fetchWorklogs(startDate?: string, endDate?: string) {
  const token = localStorage.getItem("access_token")
  let url = `${API_URL}/api/v1/worklogs/`
  const params: string[] = []
  if (startDate) params.push(`start_date=${startDate}`)
  if (endDate) params.push(`end_date=${endDate}`)
  if (params.length) url += "?" + params.join("&")
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok) throw new Error("Failed to fetch worklogs")
  return resp.json()
}

function WorklogsPage() {
  const [worklogs, setWorklogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasFetched, setHasFetched] = useState(false)

  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [page, setPage] = useState(1)
  const pageSize = 10

  const load = async (sd?: string, ed?: string) => {
    setIsLoading(true)
    setError("")
    try {
      const data = await fetchWorklogs(sd, ed)
      setWorklogs(data)
      setHasFetched(true)
      setPage(1)
    } catch (err) {
      setError("Failed to load worklogs. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilter = () => {
    load(startDate || undefined, endDate || undefined)
  }

  const clearFilter = () => {
    setStartDate("")
    setEndDate("")
    setActiveFilter(null)
    load()
  }

  const displayed = worklogs.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(worklogs.length / pageSize)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Worklogs</h1>
          <p className="text-muted-foreground">
            Review freelancer time logs and earnings
          </p>
        </div>
        <Link
          to="/payments"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Process Payment →
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-start flex-wrap">
        <button
          type="button"
          className={`rounded-md border px-4 py-1.5 text-sm font-medium transition-colors ${
            activeFilter === "dateRange"
              ? "bg-primary text-primary-foreground"
              : "bg-background hover:bg-muted"
          }`}
          onClick={() =>
            setActiveFilter(activeFilter === "dateRange" ? null : "dateRange")
          }
        >
          Date Range
          {startDate || endDate ? " ●" : ""}
        </button>

        {activeFilter === "dateRange" && (
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded border px-3 py-1.5 text-sm bg-background"
              aria-label="Start date"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded border px-3 py-1.5 text-sm bg-background"
              aria-label="End date"
            />
            <button
              type="button"
              onClick={applyFilter}
              className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Apply
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={clearFilter}
                className="rounded-md border px-4 py-1.5 text-sm hover:bg-muted"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {!hasFetched && (
          <button
            type="button"
            onClick={() => load()}
            className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Load Worklogs
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {hasFetched && !isLoading && (
        <>
          {worklogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <p className="text-muted-foreground">
                No worklogs found for the selected period.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Task</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Freelancer
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Hours
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Rate / hr
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Earned
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((wl: any, i: number) => (
                      <tr
                        key={wl.id}
                        className={`border-t hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                      >
                        <td className="px-4 py-3">
                          <Link
                            to="/worklogs/$wlId"
                            params={{ wlId: String(wl.id) }}
                            className="font-medium text-primary hover:underline"
                          >
                            {wl.task_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div>{wl.freelancer_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {wl.freelancer_email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {wl.created_at}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {wl.total_hours.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ${wl.hourly_rate.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          ${wl.total_earned.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              wl.status === "paid"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {wl.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t">
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-3 text-right font-semibold"
                      >
                        Total ({worklogs.length} worklogs)
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary">
                        $
                        {worklogs
                          .reduce((s: number, w: any) => s + w.total_earned, 0)
                          .toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted"
                    aria-label="Previous page"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted"
                    aria-label="Next page"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
