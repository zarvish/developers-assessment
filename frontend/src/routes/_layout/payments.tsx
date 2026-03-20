import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"

const API_URL = "http://localhost:8000"

export const Route = createFileRoute("/_layout/payments")({
  component: PaymentsPage,
  head: () => ({
    meta: [{ title: "Payments - Payment Dashboard" }],
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

async function fetchFreelancers() {
  const token = localStorage.getItem("access_token")
  const resp = await fetch(`${API_URL}/api/v1/worklogs/freelancers`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok) throw new Error("Failed to fetch freelancers")
  return resp.json()
}

async function postPayment(payload: any) {
  const token = localStorage.getItem("access_token")
  const resp = await fetch(`${API_URL}/api/v1/payments/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  if (!resp.ok) {
    const err = await resp.json()
    throw new Error(err.detail || "Failed to create payment")
  }
  return resp.json()
}

function PaymentsPage() {
  const [worklogs, setWorklogs] = useState<any[]>([])
  const [freelancers, setFreelancers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [excludedWlIds, setExcludedWlIds] = useState<Set<number>>(new Set())
  const [excludedFlIds, setExcludedFlIds] = useState<Set<number>>(new Set())

  const [freelancerSearch, setFreelancerSearch] = useState("")

  const [isConfirming, setIsConfirming] = useState(false)
  const [successPayment, setSuccessPayment] = useState<any>(null)
  const [confirmError, setConfirmError] = useState("")

  const filteredFreelancers = freelancers.filter((fl) =>
    fl.name.toLowerCase().includes(freelancerSearch.toLowerCase()) ||
    fl.email.toLowerCase().includes(freelancerSearch.toLowerCase())
  )

  useEffect(() => {
    const load = async () => {
      try {
        const [wls, fls] = await Promise.all([fetchWorklogs(), fetchFreelancers()])
        setWorklogs(wls)
        setFreelancers(fls)
      } catch (err) {
        setError("Failed to load data. Please try again.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const reloadWithFilter = async () => {
    setIsLoading(true)
    setError("")
    try {
      const wls = await fetchWorklogs(startDate || undefined, endDate || undefined)
      setWorklogs(wls)
      setExcludedWlIds(new Set())
      setExcludedFlIds(new Set())
    } catch (err) {
      setError("Failed to load worklogs.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleWl = (id: number) => {
    setExcludedWlIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleFl = (id: number) => {
    setExcludedFlIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pendingWorklogs = worklogs.filter((w) => w.status === "pending")

  const included = pendingWorklogs.filter(
    (w) => !excludedWlIds.has(w.id) && !excludedFlIds.has(w.freelancer_id)
  )

  const totalAmount = included.reduce(
    (s: number, w: any) => s + w.total_earned,
    0
  )

  const confirmPayment = async () => {
    setIsConfirming(true)
    setConfirmError("")
    try {
      const result = await postPayment({
        start_date: startDate || null,
        end_date: endDate || null,
        excluded_worklog_ids: Array.from(excludedWlIds),
        excluded_freelancer_ids: Array.from(excludedFlIds),
      })
      setSuccessPayment(result)
    } catch (err: any) {
      setConfirmError(err.message || "Something went wrong.")
      console.error(err)
    } finally {
      setIsConfirming(false)
    }
  }

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

  if (successPayment) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 p-8 flex flex-col items-center text-center gap-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-green-700 dark:text-green-400">
            Payment Confirmed!
          </h2>
          <p className="text-muted-foreground">
            Payment #{successPayment.id} processed successfully.
          </p>
          <div className="rounded-md bg-white dark:bg-muted/30 border px-6 py-4 text-left w-full max-w-sm">
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Payment ID</span>
              <span className="font-medium">#{successPayment.id}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-sm text-muted-foreground">Worklogs paid</span>
              <span className="font-medium">
                {successPayment.worklog_ids?.length ?? 0}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t mt-2">
              <span className="text-sm font-semibold">Total Amount</span>
              <span className="font-bold text-primary text-lg">
                ${successPayment.total_amount?.toFixed(2)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSuccessPayment(null)
              window.location.reload()
            }}
            className="rounded-md border px-6 py-2 text-sm hover:bg-muted"
          >
            Process Another Payment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Process Payment</h1>
        <p className="text-muted-foreground">
          Review worklogs and confirm a payment batch
        </p>
      </div>

      {/* Date filter */}
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
              onClick={reloadWithFilter}
              className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: worklog selection */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Exclude by freelancer */}
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-base font-semibold mb-3">Exclude Freelancers</h2>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search freelancers..."
                value={freelancerSearch}
                onChange={(e) => setFreelancerSearch(e.target.value)}
                className="w-full rounded-md border px-3 py-1.5 text-sm bg-background"
                aria-label="Search freelancers to exclude"
              />
            </div>
            {excludedFlIds.size > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center">Excluded:</span>
                {Array.from(excludedFlIds).map((id) => {
                  const fl = freelancers.find((f: any) => f.id === id)
                  if (!fl) return null
                  return (
                    <span key={id} className="inline-flex items-center gap-1 rounded bg-destructive/10 text-destructive px-2 py-0.5 text-xs">
                      {fl.name}
                      <button type="button" onClick={() => toggleFl(id)} className="hover:text-destructive/80 font-bold ml-1">×</button>
                    </span>
                  )
                })}
              </div>
            )}
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-2">
              {filteredFreelancers.map((fl: any) => (
                <label
                  key={fl.id}
                  className={`flex justify-between items-center cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
                    excludedFlIds.has(fl.id) ? "bg-destructive/5 border-destructive/20" : "hover:bg-muted"
                  }`}
                >
                  <span>{fl.name} <span className="text-muted-foreground text-xs ml-2">{fl.email}</span></span>
                  <input
                    type="checkbox"
                    checked={excludedFlIds.has(fl.id)}
                    onChange={() => toggleFl(fl.id)}
                    aria-label={`Exclude freelancer ${fl.name}`}
                    className="h-4 w-4"
                  />
                </label>
              ))}
              {filteredFreelancers.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No freelancers match your search.
                </div>
              )}
            </div>
          </div>

          {/* Worklog table */}
          <div>
            <h2 className="text-base font-semibold mb-2">
              Worklogs ({pendingWorklogs.length} pending)
            </h2>
            {pendingWorklogs.length === 0 ? (
              <div className="rounded-lg border p-8 text-center text-muted-foreground">
                No pending worklogs. All work has been paid.
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left w-10" aria-label="Include">
                        ✓
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Task</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Freelancer
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Hours
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Earned
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingWorklogs.map((wl: any, i: number) => {
                      const isExcluded =
                        excludedWlIds.has(wl.id) ||
                        excludedFlIds.has(wl.freelancer_id)
                      return (
                        <tr
                          key={wl.id}
                          className={`border-t ${isExcluded ? "opacity-40" : ""} ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={!excludedWlIds.has(wl.id)}
                              onChange={() => toggleWl(wl.id)}
                              disabled={excludedFlIds.has(wl.freelancer_id)}
                              aria-label={`Include worklog ${wl.task_name}`}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {wl.task_name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {wl.freelancer_name}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {wl.total_hours.toFixed(1)}h
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            ${wl.total_earned.toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: summary + confirm */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border p-6 sticky top-4">
            <h2 className="text-base font-semibold mb-4">Payment Summary</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Included worklogs</span>
                <span className="font-medium">{included.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Excluded worklogs</span>
                <span className="font-medium">
                  {pendingWorklogs.length - included.length}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {confirmError && (
              <div className="mt-4 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                {confirmError}
              </div>
            )}

            <button
              type="button"
              onClick={confirmPayment}
              disabled={isConfirming || included.length === 0}
              className="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Confirm and process payment"
            >
              {isConfirming ? "Processing…" : `Confirm Payment – $${totalAmount.toFixed(2)}`}
            </button>

            {included.length === 0 && pendingWorklogs.length > 0 && (
              <p className="mt-2 text-xs text-center text-muted-foreground">
                Select at least one worklog to proceed.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
