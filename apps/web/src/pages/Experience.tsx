// src/pages/Experience.tsx
import { useCallback, useEffect, useState } from "react";
import { get } from "../lib/api";
import type { ApiResponse, SectionPayload } from "../lib/types";

/** ===== Types ===== */
type ExperienceMeta = {
  experienceCode?: string;
  name?: string;
  period?: string;
  companyName?: string;
  techStack?: string;
  keywords?: string;
  details?: string;
};

type ExperienceSectionPayload = SectionPayload & {
  metadata?: { experiences?: ExperienceMeta[] | null };
};

/** ===== Helpers ===== */
const coerceList = (raw?: ExperienceMeta[] | null) =>
  (raw ?? []).map((e, i) => ({
    experienceCode: e.experienceCode ?? `${i}`,
    name: (e.name ?? "").trim(),
    period: (e.period ?? "").trim(),
    companyName: (e.companyName ?? "").trim(),
    techStack: (e.techStack ?? "").trim(),
    details: (e.details ?? "").trim(),
    keywords: (e.keywords ?? "").trim(),
  }));

const parseTechs = (techStack: string) =>
  (techStack || "")
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

/** “제목 — 본문” 1회 분리 */
const splitOnce = (line: string) => {
  const re = /\s*(?:\s-\s|\s—\s|\s:\s)\s*/; // " - " / " — " / " : "
  const idx = line.search(re);
  if (idx === -1) return { head: "", body: line };
  const match = line.match(re);
  if (!match) return { head: "", body: line };
  const cut = idx;
  return { head: line.slice(0, cut), body: line.slice(cut + match[0].length) };
};

/** 정규식 유틸 */
const PERIOD_BADGE = /\((?:19|20)\d{2}\.\d{2}[^)]*\)/g;
const NUMBER_TINT = /(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?%?)/g;

const escapeHtml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** HTML 문자열을 태그와 텍스트 토큰으로 분리 */
const splitByTags = (html: string) => html.split(/(<[^>]+>)/g);

/** 텍스트 토큰에만 키워드 밑줄 적용 */
const underlineInTextTokens = (html: string, keywords: string[]) => {
  if (!keywords.length) return html;
  const tokens = splitByTags(html);
  // 긴 키워드 우선
  const sorted = [...keywords]
    .map((k) => k.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  return tokens
    .map((tok) => {
      if (tok.startsWith("<")) return tok; // 태그는 그대로
      let out = tok;
      for (const kw of sorted) {
        const esc = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // 단어 경계 우선, 안 맞으면 부분 매칭 (너무 공격적 방지)
        const word = new RegExp(`\\b(${esc})\\b`, "gi");
        const loose = new RegExp(`(${esc})`, "gi");
        if (word.test(out)) {
          out = out.replace(
            new RegExp(`\\b(${esc})\\b`, "gi"),
            `<span class="underline decoration-sky-300 underline-offset-2">$1</span>`,
          );
        } else {
          out = out.replace(
            loose,
            `<span class="underline decoration-sky-300 underline-offset-2">$1</span>`,
          );
        }
      }
      return out;
    })
    .join("");
};

/** 본문 문자열 -> 안전/가독 하이라이트 HTML
 *  순서 중요: escape → 기간뱃지 → 숫자강조 → (태그 보존)키워드 밑줄
 */
const toHighlightedHtml = (raw: string, keywords: string[]) => {
  // 1) escape
  let html = escapeHtml(raw);

  // 2) 기간 뱃지
  html = html.replace(PERIOD_BADGE, (m) => {
    const safe = escapeHtml(m);
    return `<span class="inline-block align-[2px] rounded-full bg-neutral-100 px-2 py-0.5 text-[12px] text-neutral-600 border border-neutral-200 ml-2">${safe}</span>`;
  });

  // 3) 숫자 강조 (아직 태그가 거의 없을 때 적용)
  html = html.replace(NUMBER_TINT, (m) => {
    if (m.length > 20) return m;
    return `<span class="font-semibold text-sky-700">${m}</span>`;
  });

  // 4) 키워드 밑줄 (태그는 보존, 텍스트 토큰만 처리)
  html = underlineInTextTokens(html, keywords);

  return html;
};

/** 한 줄 디테일 → JSX (노트 스타일 행) */
const DetailRow = ({ line, keywords }: { line: string; keywords: string[] }) => {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const { head, body } = splitOnce(trimmed);
  const isTitled = head !== "";
  return (
    <div className="relative px-3 py-2">
      {/* 구슬 포인트 */}
      <span className="absolute left-0 top-[15px] h-1.5 w-1.5 rounded-full bg-sky-500/70" />
      <div className="flex flex-wrap gap-x-2">
        {isTitled && (
          <span className="text-[15px] font-semibold text-neutral-900">{head}</span>
        )}
        <span
          className="text-[15px] leading-7 text-neutral-800"
          dangerouslySetInnerHTML={{
            __html: toHighlightedHtml(isTitled ? body : trimmed, keywords),
          }}
        />
      </div>
    </div>
  );
};

/** 펼쳐지는 노트(공책) 스타일 컨테이너 */
const Notebook: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bg = `repeating-linear-gradient(
    0deg,
    rgba(2,6,23,0.06) 0px,
    rgba(2,6,23,0.06) 1px,
    rgba(255,255,255,1) 1px,
    rgba(255,255,255,1) 30px
  )`;
  return (
    <div
      className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white/95 shadow-sm"
      style={{ backgroundImage: bg }}
    >
      <div className="relative p-5 sm:p-6">
        {/* 왼쪽 노트 마진 라인 */}
        <div className="pointer-events-none absolute left-10 top-0 h-full w-px bg-sky-200/70" />
        <div className="pl-6">{children}</div>
      </div>
    </div>
  );
};

/** 칩: 연한 중립 배경 + 좌측 컬러 도트만 */
const chipBase =
  "inline-flex items-center gap-1 rounded-full bg-neutral-50 text-neutral-700 ring-1 ring-inset ring-neutral-200 px-2.5 py-1 text-[12px] leading-none";
const dotClassForTech = (t: string) => {
  const key = t.toLowerCase();
  if (key.includes("spring")) return "bg-emerald-300/60";
  if (key.includes("java")) return "bg-amber-300/60";
  if (key.includes("jsp")) return "bg-fuchsia-300/60";
  if (key.includes("mysql")) return "bg-emerald-300/60";
  if (key.includes("oracle")) return "bg-orange-300/60";
  if (key.includes("node")) return "bg-lime-300/60";
  if (key.includes(".net") || key.includes("c#")) return "bg-indigo-300/60";
  if (key.includes("unity")) return "bg-violet-300/60";
  return "bg-neutral-300/60";
};

const Experience = () => {
  const [rows, setRows] = useState<ReturnType<typeof coerceList>>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<ApiResponse<ExperienceSectionPayload>>("/experience");
      if (res.success && res.data?.metadata?.experiences) {
        setRows(coerceList(res.data.metadata.experiences));
      } else {
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (i: number) => setExpanded((v) => (v === i ? null : i));

  if (loading) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4">
        <div className="rounded-xl border border-neutral-200 bg-white/80 px-5 py-3 text-neutral-600 shadow-sm">
          불러오는 중입니다…
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-5xl px-4 pb-24">
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-neutral-900">프로젝트 경험</h1>

      <ul className="space-y-3">
        {rows.map((p, i) => {
          const open = expanded === i;
          const techs = parseTechs(p.techStack);
          const keywordList = (p.keywords || "")
            .split(/[,\n;]+/)
            .map((s) => s.trim())
            .filter(Boolean);

          return (
            <li key={p.experienceCode} className="rounded-xl border border-neutral-200 bg-white/95 shadow-sm">
              {/* 한 줄 헤더 */}
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-neutral-50/80"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[17px] font-semibold text-neutral-900">
                      {p.name || "(제목 없음)"}
                    </span>
                    {p.period && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600 ring-1 ring-inset ring-neutral-200">
                        {p.period}
                      </span>
                    )}
                    {p.companyName && (
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700 ring-1 ring-inset ring-sky-200">
                        {p.companyName}
                      </span>
                    )}
                  </div>

                  {/* 연한 칩 + 컬러 도트 */}
                  {techs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {techs.map((t, idx) => (
                        <span key={`${t}-${idx}`} className={chipBase}>
                          <i
                            className={`inline-block h-1.5 w-1.5 rounded-full ${dotClassForTech(t)}`}
                            aria-hidden
                          />
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <span
                  className={`mt-1 select-none text-sm transition-transform ${
                    open ? "rotate-180 text-sky-600" : "text-neutral-400"
                  }`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>

              {/* 펼침부: 노트(공책) 스타일 */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  open ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t border-neutral-200/70 p-4 sm:p-5">
                  <Notebook>
                    {/* 라벨 */}
                    <div className="mb-1 px-3">
                      <span className="rounded-md bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200">
                        상세
                      </span>
                    </div>

                    {(p.details || "")
                      .split("\n")
                      .map((line, idx) => (
                        <DetailRow key={idx} line={line} keywords={keywordList} />
                      ))}

                    {/* 하단 메타: 키워드만 (코드 제거) */}
                    <div className="mt-3 border-t border-neutral-200/80 px-3 pt-3 text-[12px] text-neutral-500">
                      {p.period && <span className="mr-4">기간: {p.period}</span>}
                      {keywordList.length > 0 && (
                        <span className="mr-4">키워드: {keywordList.join(", ")}</span>
                      )}
                    </div>
                  </Notebook>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default Experience;
