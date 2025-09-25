import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Card from "../components/ui/Card";
import { del, get, post } from "../lib/api";
import type { ApiResponse, SectionPayload } from "../lib/types";

type ResumeFormValues = {
  memberCode: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  skills: string;
  experiences: string;
  activities: string;
  education: string;
};

type ResumeMetadata = {
  form?: Partial<ResumeFormValues> | null;
};

type ResumeSectionPayload = SectionPayload & {
  metadata?: ResumeMetadata;
};

type ContactItem = {
  label: string;
  value: string;
  icon: LucideIcon;
  href?: string;
};

const createEmptyResumeForm = (): ResumeFormValues => ({
  memberCode: "",
  name: "",
  gender: "",
  email: "",
  phone: "",
  address: "",
  summary: "",
  skills: "",
  experiences: "",
  activities: "",
  education: "",
});

const coerceResumeForm = (raw?: Partial<ResumeFormValues> | null): ResumeFormValues => {
  const base = createEmptyResumeForm();
  if (!raw) {
    return base;
  }

  return {
    memberCode: raw.memberCode ?? "",
    name: raw.name ?? "",
    gender: raw.gender ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    address: raw.address ?? "",
    summary: raw.summary ?? "",
    skills: raw.skills ?? "",
    experiences: raw.experiences ?? "",
    activities: raw.activities ?? "",
    education: raw.education ?? "",
  };
};

const Resume = () => {
  const [section, setSection] = useState<ResumeSectionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [formValues, setFormValues] = useState<ResumeFormValues>(() => createEmptyResumeForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const metadata = useMemo<ResumeMetadata | undefined>(() => {
    return (section?.metadata as ResumeMetadata | undefined) ?? undefined;
  }, [section]);

  const loadResume = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const response = await get<ApiResponse<ResumeSectionPayload>>("/resume");
      if (response.success && response.data) {
        setSection(response.data);
        const metaForm = (response.data.metadata as ResumeMetadata | undefined)?.form;
        setFormValues(coerceResumeForm(metaForm ?? null));
        setInfoMessage(null);
      } else {
        setSection(null);
        setFormValues(createEmptyResumeForm());
        setInfoMessage(response.message || "등록된 이력서가 없습니다.");
      }
    } catch (err) {
      console.error(err);
      setSection(null);
      setFormValues(createEmptyResumeForm());
      setError("이력서를 불러오는 중 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResume();
  }, [loadResume]);

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

  const displayName = formValues.name.trim() || null;

  const contactItems = useMemo<ContactItem[]>(() => {
    const items: ContactItem[] = [];

    if (formValues.email.trim()) {
      items.push({
        label: "Email",
        value: formValues.email.trim(),
        icon: Mail,
        href: `mailto:${formValues.email.trim()}`,
      });
    }

    if (formValues.phone.trim()) {
      const sanitized = formValues.phone.replace(/\s+/g, "");
      items.push({
        label: "Phone",
        value: formValues.phone.trim(),
        icon: Phone,
        href: `tel:${sanitized}`,
      });
    }

    if (formValues.address.trim()) {
      items.push({
        label: "Location",
        value: formValues.address.trim(),
        icon: MapPin,
      });
    }

    return items;
  }, [formValues.address, formValues.email, formValues.phone]);

  const highlightBadges = useMemo<string[]>(() => {
    if (!formValues.skills.trim()) return [];
    return formValues.skills
      .split(/[,;\n]/)
      .map((token) => token.trim())
      .filter(Boolean);
  }, [formValues.skills]);

  const randomBgColors = useMemo<string[]>(() => {
    return ["bg-red-500/10", "bg-green-500/10", "bg-blue-500/10", "bg-yellow-500/10", "bg-purple-500/10"];
  }, []);

  const summary = formValues.summary.trim();
  const showSidebar = Boolean(displayName || highlightBadges.length > 0 || contactItems.length > 0);
  const formVisible = !section || editorExpanded;

  const handleFieldChange = (field: keyof ResumeFormValues, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthorized) {
      setActionError("이 기능은 로그인 후 사용할 수 있어요.");
      return;
    }
    if (!formValues.memberCode.trim()) {
      setActionError("memberCode를 입력해 주세요.");
      return;
    }

    setSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await post<ApiResponse<ResumeSectionPayload>>("/resume", formValues);
      if (response.success && response.data) {
        setSection(response.data);
        const metaForm = (response.data.metadata as ResumeMetadata | undefined)?.form;
        setFormValues(coerceResumeForm(metaForm ?? null));
        setInfoMessage(null);
        setError(null);
        setActionMessage("이력서를 저장했어요.");
      } else {
        setActionError(response.message || "이력서를 저장하지 못했어요.");
      }
    } catch (err) {
      console.error(err);
      setActionError("이력서를 저장하는 중 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthorized) {
      setActionError("이 기능은 로그인 후 사용할 수 있어요.");
      return;
    }

    const memberCode = formValues.memberCode.trim();
    if (!memberCode) {
      setActionError("삭제하려면 memberCode가 필요해요.");
      return;
    }

    if (typeof window !== "undefined") {
      const confirmed = window.confirm("등록된 이력서를 삭제할까요?");
      if (!confirmed) {
        return;
      }
    }

    setDeleting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const response = await del<ApiResponse<string>>("/resume", { params: { memberCode } });
      if (response.success) {
        await loadResume();
        setActionMessage("이력서를 삭제했어요.");
      } else {
        setActionError(response.message || "이력서를 삭제하지 못했어요.");
      }
    } catch (err) {
      console.error(err);
      setActionError("이력서를 삭제하는 중 오류가 발생했어요.");
    } finally {
      setDeleting(false);
    }
  };

  const handleReset = () => {
    const raw = metadata?.form ?? null;
    setFormValues(coerceResumeForm(raw));
    setActionMessage(null);
    setActionError(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-neutral-500">
        불러오는 중입니다...
      </div>
    );
  }

  return (
    <section
      className="
        relative mx-auto mt-10 w-full
        max-w-[95%] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl
        px-4 sm:px-6 md:px-8 lg:px-12
        pb-12 sm:pb-16 lg:pb-20
      "
    >
      {error && (
        <div className="mx-auto mb-6 w-full max-w-4xl rounded-2xl border border-rose-200 bg-rose-50/80 px-6 py-4 text-sm text-rose-600 shadow-sm">
          {error}
        </div>
      )}

      {!section && infoMessage && (
        <div className="mx-auto mb-6 w-full max-w-4xl rounded-3xl border border-dashed border-neutral-300/70 bg-white/80 p-10 text-center text-neutral-500 shadow-sm">
          {infoMessage}
        </div>
      )}

      {section && (
        <Card
          Header={
            <div className="resume-heading">
              <span className="resume-heading__label">Notebook Resume</span>
              {displayName && <h1 className="resume-heading__title">{displayName}</h1>}
              {highlightBadges.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="resume-heading__skills-label">Skills</span>
                  <div className="resume-heading__badges">
                    {highlightBadges.map((badge, idx) => {
                      const color = randomBgColors[idx % randomBgColors.length];
                      return (
                        <span
                          key={`${badge}-${idx}`}
                          className={`${color} rounded-full px-3 py-1 text-sm font-medium text-neutral-700`}
                        >
                          {badge}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {summary && (
                <p id="personal" className="resume-heading__summary">
                  {summary}
                </p>
              )}
            </div>
          }
          Content={
            <div className={showSidebar ? "resume-note-grid" : "resume-note-grid resume-note-grid--single"}>
              {showSidebar && contactItems.length > 0 && (
                <aside className="resume-contact-card">
                  <p className="resume-contact-card__title">Contact</p>
                  <ul className="resume-contact-card__list">
                    {contactItems.map((item) => {
                      const Icon = item.icon;
                      const entry = (
                        <span className="resume-contact-card__item">
                          <Icon className="resume-contact-card__icon" />
                          <span className="resume-contact-card__value">{item.value}</span>
                        </span>
                      );

                      return (
                        <li key={`${item.label}-${item.value}`}>
                          {item.href ? (
                            <a href={item.href} className="resume-contact-card__link">
                              {entry}
                            </a>
                          ) : (
                            <div className="resume-contact-card__chip">{entry}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </aside>
              )}

              <div className="resume-paper">
                {section.header && (
                  <section className="resume-block">
                    <div
                      className="resume-richtext"
                      dangerouslySetInnerHTML={{ __html: section.header ?? "" }}
                    />
                  </section>
                )}

                {section.content && (
                  <section className="resume-block">
                    <div
                      className="resume-richtext"
                      dangerouslySetInnerHTML={{ __html: section.content ?? "" }}
                    />
                  </section>
                )}

                {section.footer && (
                  <div className="resume-note-footer">
                    <div dangerouslySetInnerHTML={{ __html: section.footer ?? "" }} />
                  </div>
                )}
              </div>
            </div>
          }
          Footer={<div className="hidden" aria-hidden="true" />}
        />
      )}

      {isAuthorized && (
        <div className="mx-auto mt-12 w-full max-w-4xl">
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
            <form
              onSubmit={handleSave}
              className="rounded-3xl border border-dashed border-neutral-300 bg-white/90 p-6 shadow-sm backdrop-blur"
            >
              <h2 className="text-lg font-semibold text-neutral-800">이력서 관리</h2>
              <p className="mt-1 text-sm text-neutral-500">
                기본 정보와 경력/활동/학력을 작성하면 노트 스타일 이력서가 자동으로 그려져요.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                  memberCode
                  <input
                    type="text"
                    value={formValues.memberCode}
                    onChange={(e) => handleFieldChange("memberCode", e.target.value)}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    placeholder="예) foongdoll"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                  이름
                  <input
                    type="text"
                    value={formValues.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                  성별
                  <input
                    type="text"
                    value={formValues.gender}
                    onChange={(e) => handleFieldChange("gender", e.target.value)}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                  이메일
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                  전화번호
                  <input
                    type="text"
                    value={formValues.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                  주소
                  <input
                    type="text"
                    value={formValues.address}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5">
                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                  소개 (Summary)
                  <textarea
                    value={formValues.summary}
                    onChange={(e) => handleFieldChange("summary", e.target.value)}
                    className="min-h-[96px] rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    placeholder="간단한 소개를 적어 주세요."
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                  보유 기술 (Skills) - 쉼표/줄바꿈으로 구분
                  <textarea
                    value={formValues.skills}
                    onChange={(e) => handleFieldChange("skills", e.target.value)}
                    className="min-h-[96px] rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    placeholder="Java, Spring Boot, React..."
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                  경력 (줄바꿈으로 구분)
                  <textarea
                    value={formValues.experiences}
                    onChange={(e) => handleFieldChange("experiences", e.target.value)}
                    className="min-h-[120px] rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    placeholder="회사명 - 역할 - 기간..."
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                  대외활동
                  <textarea
                    value={formValues.activities}
                    onChange={(e) => handleFieldChange("activities", e.target.value)}
                    className="min-h-[120px] rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    placeholder="활동 내용을 줄바꿈으로 나눠 적어 주세요."
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-neutral-600">
                  학력
                  <textarea
                    value={formValues.education}
                    onChange={(e) => handleFieldChange("education", e.target.value)}
                    className="min-h-[120px] rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm text-neutral-800 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    placeholder="학교 / 전공 / 기간..."
                  />
                </label>
              </div>

              {(actionError || actionMessage) && (
                <div className="mt-5 rounded-xl border px-4 py-3 text-sm font-medium">
                  {actionError && <p className="text-rose-600">{actionError}</p>}
                  {actionMessage && <p className="text-emerald-600">{actionMessage}</p>}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
                  disabled={saving || deleting}
                >
                  {saving ? "저장 중..." : "저장하기"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-2 text-sm font-semibold text-neutral-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={saving || deleting}
                >
                  다시 불러오기
                </button>
                {section && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center justify-center rounded-full border border-rose-300 px-6 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={saving || deleting}
                  >
                    {deleting ? "삭제 중..." : "삭제하기"}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {!isAuthorized && !section && (
        <p className="mx-auto mt-8 w-full max-w-4xl text-center text-sm text-neutral-500">
          이력서를 추가하려면 로그인 후 토큰을 발급받아 주세요.
        </p>
      )}
    </section>
  );
};

export default Resume;
