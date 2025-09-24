import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { get } from "../lib/api";
import type { ApiResponse } from "../lib/types";

type PostSummary = {
  id: number;
  title: string;
  summary?: string;
  category: string;
  publishedAt?: string;
};

const Post = () => {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryParam = searchParams.get("category");
  const requestCategory = useMemo(() => {
    if (!categoryParam || categoryParam === "all") {
      return undefined;
    }
    return categoryParam;
  }, [categoryParam]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    get<ApiResponse<PostSummary[]>>("/posts", requestCategory ? { category: requestCategory } : undefined)
      .then((response) => {
        if (cancelled) return;
        if (response.success && Array.isArray(response.data)) {
          setPosts(response.data);
          return;
        }
        setPosts([]);
        setError(response.message || "포스트 데이터를 불러오지 못했습니다.");
      })
      .catch(() => {
        if (!cancelled) {
          setPosts([]);
          setError("포스트 데이터를 불러오는 중 오류가 발생했습니다.");
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
  }, [requestCategory]);

  const categoryLabel = requestCategory ?? "all";

  if (loading) {
    return <div className="p-6 text-neutral-500">불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="p-6 text-neutral-500">{error}</div>;
  }

  return (
    <section className="px-8 py-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Posts</h2>
        <p className="mt-2 text-sm text-neutral-500">카테고리: {categoryLabel}</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-neutral-500">등록된 포스트가 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold text-neutral-800">{post.title}</h3>
              {post.summary && <p className="mt-2 text-neutral-600">{post.summary}</p>}
              <div className="mt-3 text-sm text-neutral-400">
                <span className="mr-3">{post.category}</span>
                {post.publishedAt && <span>{post.publishedAt}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default Post;
