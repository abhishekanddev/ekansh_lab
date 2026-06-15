import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import type { LabParameter } from "../../lib/types";
import { generateBlocks, generateInterpretation } from "../../lib/interpretationEngine";

/**
 * Read-only preview of the interpretation that will be auto-populated into the
 * PDF for this test — mirrors the mobile behaviour where ticking "Include
 * interpretation" surfaces the generated clinical notes. Renders the structured
 * blocks (text + tables) when available, otherwise the narrative interpretation.
 */
export function InterpretationPreview({
  testType,
  results,
}: {
  testType: string;
  results: LabParameter[];
}) {
  const blocks = useMemo(() => generateBlocks(testType, results), [testType, results]);
  const narrative = useMemo(
    () => (blocks ? null : generateInterpretation(testType, results)),
    [blocks, testType, results],
  );

  if (!blocks && !narrative) {
    return (
      <div className="text-[12.5px] text-[var(--color-muted)]">
        No standard interpretation is available for this test. Use the Observation / Notes field above to add clinical notes.
      </div>
    );
  }

  return (
    <div className="space-y-3 text-[12.5px] leading-relaxed text-[var(--color-ink)]">
      {blocks
        ? blocks.map((b, i) =>
            b.kind === "text" ? (
              <p key={i} className={b.bold ? "font-semibold" : "text-[var(--color-muted)]"}>{b.text}</p>
            ) : (
              <div key={i}>
                {b.title && <div className="font-semibold mb-1">{b.title}</div>}
                <div className="overflow-x-auto">
                  <table className="text-[11.5px] border border-[var(--color-border)] rounded w-full">
                    <thead>
                      <tr className="bg-[var(--color-bg)]">
                        {b.headers.map((h) => (
                          <th key={h} className="px-2 py-1 text-left font-semibold border-b border-[var(--color-border)]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {b.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-[var(--color-border)] last:border-0">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-2 py-1 text-[var(--color-muted)]">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          )
        : (
          <p className="text-[var(--color-muted)] whitespace-pre-line">{narrative}</p>
        )}
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-faint)] pt-1">
        <Sparkles size={12} /> Auto-generated from this test's parameters. Included in the PDF when the box above is ticked.
      </div>
    </div>
  );
}
