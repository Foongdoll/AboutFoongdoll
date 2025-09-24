import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import { get } from "../lib/api";
import type { ApiResponse, SectionPayload } from "../lib/types";

const Resume = () => {
  const [section, setSection] = useState<SectionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    get<ApiResponse<SectionPayload>>("/resume")
      .then((response) => {
        if (cancelled) return;
        if (response.success && response.data) {
          setSection(response.data);
          return;
        }
        setSection(null);
        setError(response.message || "데이터를 불러오지 못했습니다.");
      })
      .catch(() => {
        if (!cancelled) {
          setSection(null);
          setError("데이터 조회 중 오류가 발생했습니다.");
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
  }, []);

  if (loading) {
    return <div className="p-6 text-neutral-500">불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="p-6 text-neutral-500">{error}</div>;
  }

  if (!section) {
    return <div className="p-6 text-neutral-500">표시할 이력서가 없습니다.</div>;
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

export default Resume;
