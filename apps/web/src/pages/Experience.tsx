import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "../components/ui/Card";
import { get } from "../lib/api";
import type { ApiResponse, SectionPayload } from "../lib/types";

const Experience = () => {
  const [searchParams] = useSearchParams();
  const [section, setSection] = useState<SectionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prjCount, setPrjCount] = useState<number>(0);

  const company = searchParams.get("company");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = company ? { company } : undefined;

    console.log(params);

    get<ApiResponse<SectionPayload>>("/experience", params)
      .then((response) => {
        if (cancelled) return;
        if (response.success && response.data) {
          setSection(response.data);
          var meta = response.data.metadata as any;        
          setPrjCount(meta.experiences.length == undefined ? 0 : meta.experiences.length);
          return; 
        }
        setSection(null);
        setError(response.message || "경험 데이터를 불러오지 못했습니다.");
      })
      .catch(() => {
        if (!cancelled) {
          setSection(null);
          setError("경험 데이터를 불러오는 중 오류가 발생했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [company]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-neutral-500">
        불러오는 중입니다...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-neutral-500">
        {error}
      </div>
    );
  }

  if (!section) {
    const emptyMessage = company
      ? "선택한 회사(" + company + ")에 대한 경험이 없습니다."
      : "표시할 경험 데이터가 없습니다.";
    return (
      <div className="mx-auto mt-16 w-full max-w-3xl rounded-3xl border border-dashed border-neutral-300/70 bg-white/80 p-12 text-center text-neutral-500 shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <section className="relative mx-auto mt-10 w-full max-w-5xl px-4 pb-16 sm:px-6 lg:px-0">
      <Card
        Header={
          <div className="experience-heading">
            <span className="experience-heading__label">Notebook Experience</span>
            <h1 className="experience-heading__title">열심히 달리며 지나친 내 기억들</h1>
            {company ? (
              <p className="experience-heading__summary">{company == "1" ? "이노베이션티(주)" : "울림(주)"} 재직 중 진행한 프로젝트 {prjCount} 건</p>
            ) : (
              <p className="experience-heading__summary">
                모든 회사에서 진행한 주요 프로젝트와 활동 내역
              </p>
            )}
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
    </section>
  );
};

export default Experience;
