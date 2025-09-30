import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { get, post, put, del } from "../lib/api";
import type { ApiResponse } from "../lib/types";

import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css"; // 원하는 테마로 교체 가능

import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

import type { Components } from "react-markdown";

const markdownComponents: Components = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  pre: (props) => (
    <pre
      {...props}
      className={[
        "rounded-lg overflow-x-auto bg-[#0b1220] p-4",
        props.className ?? "",
      ].join(" ")}
    />
  ),
};

type PostSummary = {
  id: number;
  title: string;
  summary?: string;
  category: string;
  publishedAt?: string;
  content?: string;
};

type PostFormData = {
  title: string;
  category: string;
  keywords: string;
  content: string;
  summary: string;
};

const DEFAULT_FORM: PostFormData = {
  title: "",
  category: "",
  keywords: "",
  content: "",
  summary: "",
};

const Post = () => {
  const [searchParams] = useSearchParams();

  // 목록/상태
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 인증/에디터
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<PostFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // 미리보기(오른쪽 드로어)
  const [previewOpen, setPreviewOpen] = useState(false);

  // 상세 토글
  const [openId, setOpenId] = useState<number | null>(null);

  // 수정 모드
  const [editingId, setEditingId] = useState<number | null>(null);

  // 페이지네이션
  const [page, setPage] = useState(1); // 1-based
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const categoryParam = searchParams.get("category");
  const requestCategory = useMemo(() => {
    if (!categoryParam || categoryParam === "all") return undefined;
    return categoryParam;
  }, [categoryParam]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (editorOpen) {
          setPreviewOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editorOpen]);

  // 인증 토큰 감시
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncAuth = () => setIsAuthenticated(Boolean(localStorage.getItem("token")));
    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  // 목록 가져오기(배열, 또는 {items,totalPages} 모두 대응)
  type ListResp = { items: PostSummary[]; totalPages?: number } | PostSummary[];

  const fetchPosts = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: Record<string, unknown> = {
      page: page - 1, // API가 0-based라 가정
      size,
    };
    if (requestCategory) params.category = requestCategory;

    get<ApiResponse<ListResp>>("/posts", params)
      .then((res) => {
        if (cancelled) return;
        if (!res.success || !res.data) {
          setPosts([]);
          setError(res.message || "목록을 불러오지 못했습니다.");
          setTotalPages(1);
          return;
        }
        const data = res.data;
        const items = Array.isArray(data) ? data : data.items;
        const tp = Array.isArray(data) ? 1 : (data.totalPages ?? 1);
        setPosts(items ?? []);
        setTotalPages(Math.max(tp, 1));
      })
      .catch(() => {
        if (!cancelled) {
          setPosts([]);
          setError("목록 조회 중 오류가 발생했습니다.");
          setTotalPages(1);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestCategory, page, size]);

  useEffect(() => {
    const cancel = fetchPosts();
    return () => {
      if (typeof cancel === "function") cancel();
    };
  }, [fetchPosts, refreshKey]);

  // ESC로 미리보기 닫기
  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  // 라벨/핸들러
  const categoryLabel = requestCategory ?? "all";
  const handleFieldChange =
    (field: keyof PostFormData) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { value } = event.target;
        setForm((prev) => ({ ...prev, [field]: value }));
      };
  const resetFormState = () => {
    setForm(DEFAULT_FORM);
    setSubmitError(null);
    setSubmitSuccess(null);
    setEditingId(null);
  };
  const closeEditor = () => {
    if (submitting) return;
    setEditorOpen(false);
    setPreviewOpen(false);
  };
  const previewMarkdown = form.content.trim() ? form.content : "_미리보기할 내용이 없습니다._";
  const toggleOpen = (id: number) => setOpenId((prev) => (prev === id ? null : id));

  // 저장
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!form.title.trim()) {
      setSubmitError("제목을 입력하세요.");
      return;
    }
    if (!form.content.trim()) {
      setSubmitError("본문을 작성하세요.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category.trim() || undefined,
        keywords: form.keywords.trim(),
        content: form.content,
        summary: form.summary.trim(),
      };

      let response: ApiResponse<PostSummary>;
      if (editingId != null) {
        response = await put<ApiResponse<PostSummary>>(`/posts/${editingId}`, payload);
      } else {
        response = await post<ApiResponse<PostSummary>>("/posts", payload);
      }

      if (response.success) {
        setSubmitSuccess(editingId ? "수정되었습니다." : "저장되었습니다.");
        setEditorOpen(false);
        resetFormState();
        setRefreshKey((k) => k + 1);
      } else {
        setSubmitError(response.message || "저장에 실패했습니다.");
      }
    } catch {
      setSubmitError("저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 수정/삭제
  const handleEdit = (p: PostSummary) => {
    setEditingId(p.id);
    setForm({
      title: p.title ?? "",
      category: p.category ?? "",
      keywords: "",
      content: p.content ?? "",
      summary: p.summary ?? "",
    });
    setSubmitError(null);
    setSubmitSuccess(null);
    setEditorOpen(true);
  };
  const handleDelete = async (id: number) => {
    if (!confirm("이 포스트를 삭제할까요?")) return;
    try {
      const resp = await del<ApiResponse<unknown>>(`/posts/${id}`);
      if (!resp.success) {
        alert(resp.message || "삭제에 실패했습니다.");
        return;
      }
      setRefreshKey((k) => k + 1);
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="p-6 text-neutral-500">Loading posts...</div>;
  if (error) return <div className="p-6 text-neutral-500">{error}</div>;

  // 공통 플러그인(순서 중요: raw -> highlight)
  const commonRehype = [
    [rehypeRaw],
    [rehypeHighlight, { detect: true, ignoreMissing: true }],
  ] as const;
  const commonRemark = [remarkGfm, remarkBreaks] as const;

  return (
    <>
      {/* ====== 작성/수정 패널 ====== */}
      {isAuthenticated && (
        <>
          {/* 에디터 백드롭 */}
          <div
            className={`post-editor__backdrop${editorOpen ? " post-editor__backdrop--open" : ""}`}
            onClick={closeEditor}
            aria-hidden={!editorOpen}
          />

          {/* 에디터 본체 */}
          <aside
            className={[
              "post-editor",
              editorOpen ? "post-editor--open" : "",
              previewOpen ? "post-editor--preview-open" : "",
            ].join(" ")}
            aria-hidden={!editorOpen}
          >
            <form className="post-editor__form" onSubmit={handleSubmit}>
              <header className="post-editor__header">
                <div>
                  <span className="post-editor__eyebrow">코넬 노트 초안</span>
                  <h2 className="post-editor__title">{editingId ? "게시글 수정" : "게시글 작성"}</h2>
                </div>

                {/* 닫기 옆 '미리보기' 버튼 */}
                <div className="post-editor__header-actions">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen((prev) => !prev)}
                    className="post-editor__preview-toggle"
                    data-active={previewOpen}
                    aria-pressed={previewOpen}
                  >
                    미리보기
                  </button>
                  <button type="button" onClick={closeEditor} className="post-editor__close" disabled={submitting}>
                    닫기
                  </button>
                </div>
              </header>

              {submitError && <div className="post-editor__alert post-editor__alert--error">{submitError}</div>}
              {submitSuccess && <div className="post-editor__alert post-editor__alert--success">{submitSuccess}</div>}

              {/* ==== 폼 그리드 (키워드 위/좁게, 본문 넓게) ==== */}
              <div className="cornell grid grid-cols-12 gap-6">
                {/* 제목 (1행 전체) */}
                <div className="cornell__title col-span-12">
                  <label className="cornell__label" htmlFor="post-title">제목</label>
                  <input
                    id="post-title"
                    type="text"
                    value={form.title}
                    onChange={handleFieldChange("title")}
                    placeholder="제목을 입력하세요"
                    className="cornell__input"
                  />
                </div>

                <div className="cornell__keywords col-span-12 md:col-span-3">
                  <label className="cornell__label" htmlFor="post-keywords">키워드 / 질문</label>
                  <textarea
                    id="post-keywords"
                    value={form.keywords}
                    onChange={handleFieldChange("keywords")}
                    placeholder="핵심 키워드나 질문을 기록하세요"
                    className="cornell__textarea h-28"
                  />
                </div>
                {/* 카테고리 (3행 좌측 4/12) */}
                <div className="cornell__meta col-span-12 md:col-span-4" style={{ gridAutoColumns: "max-content" }}>
                  <label className="cornell__label" htmlFor="post-category">카테고리</label>
                  <input
                    id="post-category"
                    type="text"
                    value={form.category}
                    onChange={handleFieldChange("category")}
                    placeholder="예: frontend / backend"
                    className="cornell__input"
                  />
                </div>

                <div
                  className="cornell__notes"
                  style={{ gridColumn: "1 / -1" }}   // ✅ 가로 전체 사용
                >
                  <label className="cornell__label" htmlFor="post-content">본문 (마크다운 지원)</label>
                  <div data-color-mode="light" className="cornell__editor">
                    <MDEditor
                      value={form.content}
                      onChange={(v) => setForm((p) => ({ ...p, content: v ?? "" }))}
                      preview="edit"
                      height={620}
                      textareaProps={{
                        id: "post-content",
                        placeholder: "마크다운으로 본문을 작성하세요",
                        style: {
                          fontFamily:
                            "Nanum Pen Script",
                        },
                      }}
                    />
                  </div>
                </div>


                {/* 요약 (마지막 행) */}
                <div className="cornell__summary col-span-12">
                  <label className="cornell__label" htmlFor="post-summary">요약</label>
                  <textarea
                    id="post-summary"
                    value={form.summary}
                    onChange={handleFieldChange("summary")}
                    placeholder="핵심 내용을 요약하세요"
                    className="cornell__textarea cornell__textarea--summary"
                  />
                </div>
              </div>

              <footer className="post-editor__footer">
                <div className="post-editor__hint">
                  줄바꿈은 <kbd>Shift</kbd> + <kbd>Enter</kbd> 로 입력할 수 있어요.
                </div>
                <div className="post-editor__actions">
                  <button
                    type="button"
                    className="post-editor__secondary"
                    onClick={() => { resetFormState(); closeEditor(); }}
                    disabled={submitting}
                  >
                    취소
                  </button>
                  <button type="submit" className="post-editor__primary" disabled={submitting}>
                    {submitting ? "저장 중..." : (editingId ? "수정 저장" : "저장")}
                  </button>
                </div>
              </footer>
            </form>
          </aside>

          {/* === 오른쪽 프리뷰 드로어(에디터 바깥 / z-index 높음) === */}
          {previewOpen && (
            <>
              <div className="post-editor__backdrop post-editor__backdrop--open" onClick={() => setPreviewOpen(false)} aria-hidden="true" />
              <aside
                className={`post-preview-pane ${previewOpen ? "post-preview-pane--open" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-label="미리보기"
              >
                <header className="post-preview-pane__header">
                  <div className="post-preview-pane__title">미리보기</div>
                  <div className="post-preview-pane__subtitle"><span style={{ fontSize: 36 }}>작성 중인 본문을 실시간으로 확인<br />열고 닫기의 경우 Tab으로 제어하세요</span></div>
                </header>
                <div className="post-preview-pane__body">
                  <div className="post-preview-card">
                    <div className="post-preview-card__meta">
                      <span className="post-preview-card__category">{form.category || "카테고리 없음"}</span>

                    </div>
                    <div className="post-preview-card__title">{form.title || "제목 없음"}</div>
                    {form.summary ? (
                      <div className="post-preview-card__summary">{form.summary}</div>
                    ) : (
                      <div className="post-preview-card__summary post-preview-card__placeholder">요약이 없습니다.</div>
                    )}
                    <div className="post-preview-card__divider" />
                    <div className="post-preview-card__markdown prose max-w-none">
                      <ReactMarkdown
                        remarkPlugins={commonRemark as any}
                        rehypePlugins={commonRehype as any}
                        components={markdownComponents}
                      >
                        {previewMarkdown}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </aside>
            </>
          )}
        </>
      )}

      {/* ====== 목록(페이지네이션 + 상세 토글 + 수정/삭제) ====== */}
      <section className="px-8 py-6 post_list">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">Posts</h2>
            <p className="mt-2 text-sm text-neutral-500">Category: {categoryLabel}</p>
          </div>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(DEFAULT_FORM);
                setSubmitError(null);
                setSubmitSuccess(null);
                setEditorOpen(true);
              }}
              className="inline-flex items-center rounded-xl border border-red-200 bg-red-100/60 px-5 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100"
            >
              새 글
            </button>
          )}
        </header>

        {submitSuccess && !editorOpen && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            {submitSuccess}
          </div>
        )}

        {posts.length === 0 ? (
          <p className="text-neutral-500">No posts yet.</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => {
              const isOpen = openId === post.id;
              return (
                <li key={post.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-col">
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold text-neutral-800 break-words">{post.title}</h3>
                      {post.summary && (
                        <ReactMarkdown
                          className="mt-2 text-neutral-600 prose prose-sm max-w-none"
                          remarkPlugins={commonRemark as any}
                          rehypePlugins={commonRehype as any}
                          components={markdownComponents}
                        >
                          {post.summary}
                        </ReactMarkdown>
                      )}

                      <div className="mt-3 text-sm text-neutral-400">
                        <span className="mr-3">{post.category ?? "카테고리 없음"}</span>
                        {post.publishedAt && <span>{post.publishedAt}</span>}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {post.content && (
                        <button
                          type="button"
                          onClick={() => toggleOpen(post.id)}
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:-translate-y-0.5 hover:bg-neutral-50 transition"
                          aria-expanded={isOpen}
                          aria-controls={`post-panel-${post.id}`}
                        >
                          {isOpen ? "닫기" : "자세히"}
                        </button>
                      )}

                      {isAuthenticated && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(post)}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:-translate-y-0.5 transition"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(post.id)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 hover:-translate-y-0.5 transition"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {post.content && isOpen && (
                    <article
                      id={`post-panel-${post.id}`}
                      className="mt-4 prose prose-neutral max-w-none border-t border-neutral-200 pt-4 text-white"
                    >
                      <ReactMarkdown
                        remarkPlugins={commonRemark as any}
                        rehypePlugins={commonRehype as any}
                        components={markdownComponents}
                      >
                        {post.content}
                      </ReactMarkdown>
                    </article>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* 페이지네이션 */}
        <div className="mt-6">
          {totalPages > 0 && (
            <nav className="pager" aria-label="페이지 네비게이션">
              <button
                type="button"
                className="pager__btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                이전
              </button>

              <span className="pager__page" aria-current="page">{page}</span>

              <button
                type="button"
                className="pager__btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                다음
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  );
};

export default Post;
