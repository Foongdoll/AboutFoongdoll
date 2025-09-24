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

  const company = searchParams.get("company");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = company ? { company } : undefined;

    get<ApiResponse<SectionPayload>>("/experience", params)
      .then((response) => {
        if (cancelled) return;
        if (response.success && response.data) {
          setSection(response.data);
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
    return <div className="p-6 text-neutral-500">불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="p-6 text-neutral-500">{error}</div>;
  }

  if (!section) {
    const emptyMessage = company
      ? `선택한 회사(${company})에 대한 경험이 없습니다.`
      : "표시할 경험 데이터가 없습니다.";
    return <div className="p-6 text-neutral-500">{emptyMessage}</div>;
  }

  return (
    <Card
      Header={
        <div
          className="px-8 pt-6"
          dangerouslySetInnerHTML={{ __html: section.header ?? "" }}
        />
      }
      Content={<div dangerouslySetInnerHTML={{ __html: section.content ?? "" }} />}
      Footer={
        <div
          className="px-8 pb-6"
          dangerouslySetInnerHTML={{ __html: section.footer ?? "" }}
        />
      }
    />
  );
};

export default Experience;
