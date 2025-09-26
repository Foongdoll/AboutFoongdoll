import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "../components/ui/Card";
import { del, get, post } from "../lib/api";
import type { ApiResponse, SectionPayload } from "../lib/types";

type ExperienceFormValues = {
  experienceCode: string;
  name: string;
  companyCode: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyIndustry: string;
  companyDepartment: string;
  companyPosition: string;
  companySalary: string;
  period: string;
  role: string;
  techStack: string;
  keywords: string;
  details: string;
};

type ExperienceMetadata = {
  experiences?: Array<
    Partial<ExperienceFormValues> & {
      companySalary?: number | string | null;
    }
  > | null;
};

type ExperienceSectionPayload = SectionPayload & {
  metadata?: ExperienceMetadata;
};

const createEmptyExperienceForm = (defaults?: Partial<ExperienceFormValues>): ExperienceFormValues => ({
  experienceCode: "",
  name: "",
  companyCode: "",
  companyName: "",
  companyAddress: "",
  companyPhone: "",
  companyIndustry: "",
  companyDepartment: "",
  companyPosition: "",
  companySalary: "",
  period: "",
  role: "",
  techStack: "",
  keywords: "",
  details: "",
  ...defaults,
});

const coerceExperienceForm = (
  raw?: (Partial<ExperienceFormValues> & { companySalary?: number | string | null }) | null,
): ExperienceFormValues => {
  if (!raw) {
    return createEmptyExperienceForm();
  }

  return createEmptyExperienceForm({
    experienceCode: raw.experienceCode ?? "",
    name: raw.name ?? "",
    companyCode: raw.companyCode ?? "",
    companyName: raw.companyName ?? "",
    companyAddress: raw.companyAddress ?? "",
    companyPhone: raw.companyPhone ?? "",
    companyIndustry: raw.companyIndustry ?? "",
    companyDepartment: raw.companyDepartment ?? "",
    companyPosition: raw.companyPosition ?? "",
    companySalary: raw.companySalary != null ? String(raw.companySalary) : "",
    period: raw.period ?? "",
    role: raw.role ?? "",
    techStack: raw.techStack ?? "",
    keywords: raw.keywords ?? "",
    details: raw.details ?? "",
  });
};

const Experience = () => {
  const [searchParams] = useSearchParams();
  const companyParam = searchParams.get("company");
  const company = companyParam ? companyParam.trim() : "";

  const [section, setSection] = useState<ExperienceSectionPayload | null>(null);
  const [experienceForms, setExperienceForms] = useState<ExperienceFormValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadExperience = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      if (!silent) {
        setInfoMessage(null);
      }

      try {
        const params = company ? { company } : undefined;
        const response = await get<ApiResponse<ExperienceSectionPayload>>("/experience", params);
        if (response.success && response.data) {
          setSection(response.data);
          const rawExperiences = (
            ((response.data.metadata as ExperienceMetadata | undefined)?.experiences ?? []) as Array<
              Partial<ExperienceFormValues> & { companySalary?: number | string | null }
            >
          ).map((exp) => coerceExperienceForm(exp));
          setExperienceForms(rawExperiences);
          setInfoMessage(null);
        } else {
          setSection(null);
          setExperienceForms([]);
          setInfoMessage(response.message || "등록된 경력 기록이 없습니다.");
        }
      } catch (err) {
        console.error(err);
        setSection(null);
        setExperienceForms([]);
        setError("경력 정보를 불러오는 중 오류가 발생했어요.");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [company],
  );

  useEffect(() => {
    loadExperience();
  }, [loadExperience]);

  useEffect(() => {
    const syncToken = () => {
      if (typeof window === "undefined") return;
      setIsAuthorized(Boolean(window.localStorage.getItem("token")));
    };

    syncToken();
    window.addEventListener("storage", syncToken);
    window.addEventListener("focus", syncToken);

    return () => {
      window.removeEventListener("storage", syncToken);
      window.removeEventListener("focus", syncToken);
    };
  }, []);

  useEffect(() => {
    if (!loading && isAuthorized && !section && experienceForms.length === 0) {
      setExperienceForms([createEmptyExperienceForm({ companyCode: company })]);
      setEditorExpanded(true);
    }
  }, [loading, isAuthorized, section, experienceForms.length, company]);

  const projectCount = experienceForms.length;

  const selectedCompanyName = useMemo(() => {
    const names = experienceForms
      .map((exp) => exp.companyName?.trim())
      .filter((name): name is string => Boolean(name));
    return names.length > 0 ? names[0] : null;
  }, [experienceForms]);

  const summaryText = company
    ? `${selectedCompanyName ?? "선택한 회사"} 프로젝트 ${projectCount}건`
    : "모든 회사에서 진행한 주요 프로젝트와 역할을 모았습니다.";

  const formVisible = !section || editorExpanded;

  const handleExperienceChange = (index: number, field: keyof ExperienceFormValues, value: string) => {
    setExperienceForms((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const normalizeExperiencePayload = (form: ExperienceFormValues) => {
    const trim = (value: string) => value.trim();
    const toOptional = (value: string) => {
      const next = trim(value);
      return next.length > 0 ? next : undefined;
    };

    const salaryRaw = trim(form.companySalary);
    const salaryNum = salaryRaw ? Number(salaryRaw) : undefined;
    const companySalary = typeof salaryNum === "number" && Number.isFinite(salaryNum) ? salaryNum : undefined;

    return {
      experienceCode: trim(form.experienceCode),
      name: trim(form.name),
      companyCode: trim(form.companyCode),
      companyName: toOptional(form.companyName),
      companyAddress: toOptional(form.companyAddress),
      companyPhone: toOptional(form.companyPhone),
      companyIndustry: toOptional(form.companyIndustry),
      companyDepartment: toOptional(form.companyDepartment),
      companyPosition: toOptional(form.companyPosition),
      companySalary,
      period: trim(form.period),
      role: trim(form.role),
      techStack: trim(form.techStack),
      keywords: trim(form.keywords),
      details: form.details.replace(/\r?\n/g, "\n").trim(),
    };
  };

  const handleSaveExperience = async (index: number) => {
    const form = experienceForms[index];
    if (!form) return;

    if (!isAuthorized) {
      setActionError("이 기능은 로그인 후 사용할 수 있어요.");
      return;
    }

    if (!form.experienceCode.trim()) {
      setActionError("experienceCode를 입력해 주세요.");
      return;
    }

    if (!form.companyCode.trim()) {
      setActionError("companyCode를 입력해 주세요.");
      return;
    }

    setSavingIndex(index);
    setActionError(null);
    setActionMessage(null);

    try {
      const payload = normalizeExperiencePayload(form);
      const response = await post<ApiResponse<ExperienceSectionPayload>>("/experience", payload);
      if (response.success) {
        setActionMessage("경력을 저장했어요.");
        await loadExperience({ silent: true });
      } else {
        setActionError(response.message || "경력을 저장하지 못했어요.");
      }
    } catch (err) {
      console.error(err);
      setActionError("경력을 저장하는 중 오류가 발생했어요.");
    } finally {
      setSavingIndex(null);
    }
  };

  const handleDeleteExperience = async (experienceCode: string) => {
    if (!isAuthorized) {
      setActionError("이 기능은 로그인 후 사용할 수 있어요.");
      return;
    }

    const code = experienceCode.trim();
    if (!code) {
      setActionError("삭제하려면 experienceCode가 필요해요.");
      return;
    }

    if (typeof window !== "undefined") {
      const confirmed = window.confirm("해당 경력 기록을 삭제할까요?");
      if (!confirmed) {
        return;
      }
    }

    setDeletingCode(code);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await del<ApiResponse<string>>("/experience", { params: { experienceCode: code } });
      if (response.success) {
        setActionMessage("경력을 삭제했어요.");
        await loadExperience({ silent: true });
      } else {
        setActionError(response.message || "경력을 삭제하지 못했어요.");
      }
    } catch (err) {
      console.error(err);
      setActionError("경력을 삭제하는 중 오류가 발생했어요.");
    } finally {
      setDeletingCode(null);
    }
  };

  const handleAddExperience = () => {
    setExperienceForms((prev) => [
      ...prev,
      createEmptyExperienceForm({
        companyCode: company,
        companyName: selectedCompanyName ?? "",
      }),
    ]);
    setEditorExpanded(true);
    setActionError(null);
    setActionMessage(null);
  };

  const handleReloadAll = () => {
    loadExperience();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-neutral-500">
        불러오는 중입니다...
      </div>
    );
  }

  return (
    <section className="relative mx-auto mt-10 w-full max-w-5xl px-4 pb-16 sm:px-6 lg:px-0">
      {error && (
        <div className="mx-auto mb-6 w-full rounded-2xl border border-rose-200 bg-rose-50/80 px-6 py-4 text-sm text-rose-600 shadow-sm">
          {error}
        </div>
      )}

      {!section && infoMessage && (
        <div className="mx-auto mb-6 w-full rounded-3xl border border-dashed border-neutral-300/70 bg-white/80 p-10 text-center text-neutral-500 shadow-sm">
          {infoMessage}
        </div>
      )}

      {section && (
        <Card
          Header={
            <div className="experience-heading">
              <span className="experience-heading__label">Notebook Experience</span>
              <h1 className="experience-heading__title">프로젝트 로그</h1>
              <p className="experience-heading__summary">{summaryText}</p>
            </div>
          }
          Content={
            <div className="experience-paper">
              {section.header && (
                <section className="experience-block experience-block--header">
                  <div
                    className="experience-richtext"
                    dangerouslySetInnerHTML={{ __html: section.header ?? "" }}
                  />
                </section>
              )}

              {section.content && (
                <section className="experience-block experience-block--timeline">
                  <div
                    className="experience-timeline"
                    dangerouslySetInnerHTML={{ __html: section.content ?? "" }}
                  />
                </section>
              )}

              {section.footer && (
                <div className="experience-note-footer">
                  <div dangerouslySetInnerHTML={{ __html: section.footer ?? "" }} />
                </div>
              )}
            </div>
          }
          Footer={<div className="hidden" aria-hidden="true" />}
        />
      )}

      {isAuthorized && (
        <div className="mx-auto mt-12 w-full">
          {section && (
            <button
              type="button"
              onClick={() => setEditorExpanded((prev) => !prev)}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white/70 px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              {editorExpanded ? "작성 폼 접기" : "작성 폼 펼치기"}
            </button>
          )}

          {formVisible && (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-800">경력 관리</h2>
                  <p className="text-sm text-neutral-500">
                    프로젝트 코드를 입력하고 저장하면 노트 형식의 경력 타임라인이 자동으로 업데이트됩니다.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="inline-flex items-center justify-center rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
                  >
                    새 경력 추가
                  </button>
                  <button
                    type="button"
                    onClick={handleReloadAll}
                    className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
                  >
                    다시 불러오기
                  </button>
                </div>
              </div>

              {(actionError || actionMessage) && (
                <div className="mt-5 rounded-xl border px-4 py-3 text-sm font-medium">
                  {actionError && <p className="text-rose-600">{actionError}</p>}
                  {actionMessage && <p className="text-emerald-600">{actionMessage}</p>}
                </div>
              )}

              <div className="mt-6 space-y-6">
                {experienceForms.map((form, index) => (
                  <div
                    key={`${form.experienceCode || "new"}-${index}`}
                    className="rounded-2xl border border-neutral-200/70 bg-white/95 p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-base font-semibold text-neutral-700">
                        경력 #{index + 1}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveExperience(index)}
                          className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
                          disabled={savingIndex !== null || deletingCode !== null}
                        >
                          {savingIndex === index ? "저장 중..." : "저장"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(form.experienceCode)}
                          className="inline-flex items-center justify-center rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={savingIndex !== null || deletingCode === form.experienceCode.trim()}
                        >
                          {deletingCode === form.experienceCode.trim() ? "삭제 중..." : "삭제"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        experienceCode
                        <input
                          type="text"
                          value={form.experienceCode}
                          onChange={(e) => handleExperienceChange(index, "experienceCode", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          placeholder="예) EXP-001"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        companyCode
                        <input
                          type="text"
                          value={form.companyCode}
                          onChange={(e) => handleExperienceChange(index, "companyCode", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          placeholder="예) COM-001"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        회사명
                        <input
                          type="text"
                          value={form.companyName}
                          onChange={(e) => handleExperienceChange(index, "companyName", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        프로젝트명
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => handleExperienceChange(index, "name", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        기간
                        <input
                          type="text"
                          value={form.period}
                          onChange={(e) => handleExperienceChange(index, "period", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          placeholder="예) 2022.01 - 2023.06"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        역할
                        <input
                          type="text"
                          value={form.role}
                          onChange={(e) => handleExperienceChange(index, "role", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          placeholder="예) 백엔드 개발"
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        회사 주소
                        <input
                          type="text"
                          value={form.companyAddress}
                          onChange={(e) => handleExperienceChange(index, "companyAddress", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        회사 연락처
                        <input
                          type="text"
                          value={form.companyPhone}
                          onChange={(e) => handleExperienceChange(index, "companyPhone", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        업종
                        <input
                          type="text"
                          value={form.companyIndustry}
                          onChange={(e) => handleExperienceChange(index, "companyIndustry", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        부서
                        <input
                          type="text"
                          value={form.companyDepartment}
                          onChange={(e) => handleExperienceChange(index, "companyDepartment", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        직책
                        <input
                          type="text"
                          value={form.companyPosition}
                          onChange={(e) => handleExperienceChange(index, "companyPosition", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        연봉 (숫자)
                        <input
                          type="number"
                          value={form.companySalary}
                          onChange={(e) => handleExperienceChange(index, "companySalary", e.target.value)}
                          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          min="0"
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4">
                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        기술 스택 (쉼표/줄바꿈으로 구분)
                        <textarea
                          value={form.techStack}
                          onChange={(e) => handleExperienceChange(index, "techStack", e.target.value)}
                          className="min-h-[90px] rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          placeholder="Java, Spring Boot, AWS..."
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        키워드 (쉼표/줄바꿈으로 구분)
                        <textarea
                          value={form.keywords}
                          onChange={(e) => handleExperienceChange(index, "keywords", e.target.value)}
                          className="min-h-[90px] rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          placeholder="서비스 안정화, 리팩터링..."
                        />
                      </label>

                      <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                        상세 내용 (줄바꿈마다 항목으로 표시돼요)
                        <textarea
                          value={form.details}
                          onChange={(e) => handleExperienceChange(index, "details", e.target.value)}
                          className="min-h-[140px] rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                          placeholder={"• 프로젝트 목표\n• 담당 업무\n• 성과"}
                        />
                      </label>
                    </div>
                  </div>
                ))}

                {experienceForms.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/70 p-6 text-center text-sm text-neutral-500">
                    경력 양식을 추가해 작성해 주세요.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!isAuthorized && !section && (
        <p className="mx-auto mt-8 w-full text-center text-sm text-neutral-500">
          경력을 추가하려면 로그인 후 토큰을 발급받아 주세요.
        </p>
      )}
    </section>
  );
};

export default Experience;



