import { useMemo, useState } from "react";
import { Search, Save, Check } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/ui";
import { LAB_TEST_TEMPLATES, TEST_CATEGORIES } from "../data/labTestTemplates";
import { useTestCatalog, useSaveCatalogPrice } from "../hooks/useLabData";
import { useCanWrite } from "../hooks/useSubscription";
import { fmtMoney } from "../lib/format";

export function TestCatalog() {
  const catalog = useTestCatalog();
  const savePrice = useSaveCatalogPrice();
  const { canWrite, reason } = useCanWrite();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [editing, setEditing] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState("");

  const overlay = useMemo(() => {
    const m = new Map<string, { price: number; isActive: boolean }>();
    for (const c of catalog.data ?? []) m.set(c.testName, { price: c.price ?? 0, isActive: c.isActive ?? true });
    return m;
  }, [catalog.data]);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return LAB_TEST_TEMPLATES.filter(
      (t) =>
        (cat === "All" || t.category === cat) &&
        (!ql || t.testName.toLowerCase().includes(ql) || t.category.toLowerCase().includes(ql)),
    );
  }, [q, cat]);

  function startEdit(name: string) {
    setEditing(name);
    setDraftPrice(String(overlay.get(name)?.price ?? ""));
  }

  async function commit(name: string, category: string) {
    const price = Number(draftPrice) || 0;
    await savePrice.mutateAsync({ testName: name, category, price, isActive: overlay.get(name)?.isActive ?? true });
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Home / Test Catalog"
        title="Test Catalog"
        description={`${LAB_TEST_TEMPLATES.length} pre-built tests with reference ranges. Set per-test pricing for your lab.`}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" />
          <input
            className="input pl-9"
            placeholder="Search tests…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input max-w-[220px]" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option>All</option>
          {TEST_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {catalog.isLoading ? (
          <Spinner />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-faint)] border-b border-[var(--color-border)]">
                <th className="font-semibold px-4 py-2.5">Test</th>
                <th className="font-semibold px-4 py-2.5">Category</th>
                <th className="font-semibold px-4 py-2.5">Parameters</th>
                <th className="font-semibold px-4 py-2.5 text-right w-[200px]">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const ov = overlay.get(t.testName);
                const isEditing = editing === t.testName;
                return (
                  <tr key={t.testName} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]">
                    <td className="px-4 py-3 font-medium">{t.testName}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{t.category}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)] num">{t.parameters.length}</td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-2 justify-end">
                          <input
                            autoFocus
                            type="number"
                            className="input h-8 w-24 text-right"
                            value={draftPrice}
                            onChange={(e) => setDraftPrice(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && commit(t.testName, t.category)}
                          />
                          <button
                            className="btn btn-primary h-8 px-2"
                            disabled={savePrice.isPending}
                            onClick={() => commit(t.testName, t.category)}
                          >
                            <Save size={14} />
                          </button>
                        </div>
                      ) : canWrite ? (
                        <button
                          className="num hover:underline text-[var(--color-primary-600)] font-medium inline-flex items-center gap-1"
                          onClick={() => startEdit(t.testName)}
                        >
                          {ov ? fmtMoney(ov.price) : <span className="text-[var(--color-faint)]">Set price</span>}
                          {ov && <Check size={12} className="text-[var(--color-success)]" />}
                        </button>
                      ) : (
                        <span className="num inline-flex items-center gap-1 text-[var(--color-muted)]" title={reason ?? undefined}>
                          {ov ? fmtMoney(ov.price) : <span className="text-[var(--color-faint)]">—</span>}
                          {ov && <Check size={12} className="text-[var(--color-success)]" />}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
