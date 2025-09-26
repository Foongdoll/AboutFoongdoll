import { useCallback, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { get, post } from "../lib/api";
import type { ApiResponse } from "../lib/types";

type PostSummary = {
  id: number;
  title: string;
  summary?: string;
  category: string;
  publishedAt?: string;
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
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<PostFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const categoryParam = searchParams.get("category");
  const requestCategory = useMemo(() => {
    if (!categoryParam || categoryParam === "all") {
      return undefined;
    }
    return categoryParam;
  }, [categoryParam]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncAuth = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("token")));
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const fetchPosts = useCallback(() => {
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
        setError(response.message || "Failed to load posts.");
      })
      .catch(() => {
        if (!cancelled) {
          setPosts([]);
          setError("Something went wrong while loading posts.");
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

  useEffect(() => {
    const cancel = fetchPosts();
    return () => {
      if (typeof cancel === "function") {
        cancel();
      }
    };
  }, [fetchPosts, refreshKey]);

  useEffect(() => {
    if (!previewModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPreviewModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewModalOpen]);


  const categoryLabel = requestCategory ?? "all";

  const handleFieldChange =
    (field: keyof PostFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const resetFormState = () => {
    setForm(DEFAULT_FORM);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const closeEditor = () => {
    if (submitting) return;
    setEditorOpen(false);
    setPreviewModalOpen(false);
  };
  const previewMarkdown = form.content.trim() ? form.content : "_Draft content will render here._";

  const openPreviewModal = () => {
    setPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setPreviewModalOpen(false);
  };

  const handlePreviewKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPreviewModal();
    }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!form.title.trim()) {
      setSubmitError("Please fill the title column.");
      return;
    }

    if (!form.content.trim()) {
      setSubmitError("Write something in the notes column.");
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

      const response = await post<ApiResponse<PostSummary>>("/posts", payload);

      if (response.success) {
        setSubmitSuccess("Saved a new post.");
        setEditorOpen(false);
        resetFormState();
        setRefreshKey((prev) => prev + 1);
      } else {
        setSubmitError(response.message || "Failed to save the post.");
      }
    } catch (err) {
      setSubmitError("Something went wrong while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-neutral-500">Loading posts...</div>;
  }

  if (error) {
    return <div className="p-6 text-neutral-500">{error}</div>;
  }

  return (
    <>
      {isAuthenticated && (
        <>
          <div
            className={`post-editor__backdrop${editorOpen ? " post-editor__backdrop--open" : ""}`}
            onClick={closeEditor}
            aria-hidden={!editorOpen}
          />

          <aside className={`post-editor${editorOpen ? " post-editor--open" : ""}`} aria-hidden={!editorOpen}>
            <form className="post-editor__form" onSubmit={handleSubmit}>
              <header className="post-editor__header">
                <div>
                  <span className="post-editor__eyebrow">Cornell Note Draft</span>
                  <h2 className="post-editor__title">Compose a Post</h2>
                </div>
                <button type="button" onClick={closeEditor} className="post-editor__close" disabled={submitting}>
                  Close
                </button>
              </header>

              {submitError && <div className="post-editor__alert post-editor__alert--error">{submitError}</div>}
              {submitSuccess && <div className="post-editor__alert post-editor__alert--success">{submitSuccess}</div>}

              <div className="cornell">
                <div className="cornell__title">
                  <label className="cornell__label" htmlFor="post-title">
                    Title Column
                  </label>
                  <input
                    id="post-title"
                    type="text"
                    value={form.title}
                    onChange={handleFieldChange("title")}
                    placeholder="Enter a post title"
                    className="cornell__input"
                  />
                  <div
                    className="cornell__preview"
                    role="button"
                    tabIndex={0}
                    aria-label="Open markdown preview"
                    onClick={openPreviewModal}
                    onKeyDown={handlePreviewKeyDown}
                  >
                    <span className="cornell__preview-label">Preview</span>
                    <ReactMarkdown className="cornell__markdown" aria-live="polite">
                      {previewMarkdown}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="cornell__meta">
                  <label className="cornell__label" htmlFor="post-category">
                    Category
                  </label>
                  <input
                    id="post-category"
                    type="text"
                    value={form.category}
                    onChange={handleFieldChange("category")}
                    placeholder="e.g. frontend / backend"
                    className="cornell__input"
                  />
                </div>

                <div className="cornell__keywords">
                  <label className="cornell__label" htmlFor="post-keywords">
                    Cue Column
                  </label>
                  <textarea
                    id="post-keywords"
                    value={form.keywords}
                    onChange={handleFieldChange("keywords")}
                    placeholder="Capture keywords or questions"
                    className="cornell__textarea"
                  />
                </div>

                <div className="cornell__notes">
                  <label className="cornell__label" htmlFor="post-content">
                    Notes Column (Markdown ready)
                  </label>
                  <textarea
                    id="post-content"
                    value={form.content}
                    onChange={handleFieldChange("content")}
                    placeholder="Write the main content in Markdown"
                    className="cornell__textarea cornell__textarea--notes"
                  />
                  <div
                    className="cornell__preview"
                    role="button"
                    tabIndex={0}
                    aria-label="Open markdown preview"
                    onClick={openPreviewModal}
                    onKeyDown={handlePreviewKeyDown}
                  >
                    <span className="cornell__preview-label">Preview</span>
                    <ReactMarkdown className="cornell__markdown" aria-live="polite">
                      {previewMarkdown}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="cornell__summary">
                  <label className="cornell__label" htmlFor="post-summary">
                    Summary Column
                  </label>
                  <textarea
                    id="post-summary"
                    value={form.summary}
                    onChange={handleFieldChange("summary")}
                    placeholder="Wrap up key takeaways"
                    className="cornell__textarea cornell__textarea--summary"
                  />
                </div>
              </div>

              <footer className="post-editor__footer">
                <div className="post-editor__hint">Use Shift + Enter for a quick line break.</div>
                <div className="post-editor__actions">
                  <button
                    type="button"
                    className="post-editor__secondary"
                    onClick={() => {
                      resetFormState();
                      closeEditor();
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="post-editor__primary" disabled={submitting}>
                    {submitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </footer>
            </form>
          </aside>
          {previewModalOpen && (
            <>
              <div className="preview-modal__backdrop" onClick={closePreviewModal} aria-hidden="true" />
              <div className="preview-modal" role="dialog" aria-modal="true" aria-label="Markdown preview">
                <header className="preview-modal__header">
                  <h3 className="preview-modal__title">Markdown Preview</h3>
                  <button type="button" className="preview-modal__close" onClick={closePreviewModal}>
                    Close
                  </button>
                </header>
                <div className="preview-modal__body">
                  <ReactMarkdown className="preview-modal__markdown">
                    {previewMarkdown}
                  </ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <section className="px-8 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">Posts</h2>
            <p className="mt-2 text-sm text-neutral-500">Category: {categoryLabel}</p>
          </div>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setEditorOpen(true);
                setSubmitError(null);
                setSubmitSuccess(null);
              }}
              className="inline-flex items-center rounded-xl border border-red-200 bg-red-100/60 px-5 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-100"
            >
              New Post
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
    </>
  );
};

export default Post;
