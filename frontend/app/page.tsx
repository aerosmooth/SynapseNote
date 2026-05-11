"use client";

import { useEffect, useMemo, useState } from "react";

type ApiError = {
  code: string;
  message: string;
};

type ApiResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: ApiError;
    };

type Tag = {
  tag_id: number;
  tag_name: string;
};

type Subject = {
  subject_id: number;
  subject_name: string;
};

type MemoSummary = {
  memo_id: number;
  memo_name: string;
};

type MemoDetail = MemoSummary & {
  memo_detail: string;
};

type QA = {
  qa_id: number;
  question: string;
  answer: string;
  explanation: string;
  subject_id: number;
  memo_id: number;
};

type RepeatSubject = Subject;

type RepeatDetail = Subject & {
  subject_detail: string;
};

type IconName =
  | "activity"
  | "check"
  | "chevronDown"
  | "chevronUp"
  | "home"
  | "layers"
  | "menu"
  | "notebook"
  | "plus"
  | "qa"
  | "repeat"
  | "search"
  | "spark";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"
).replace(/\/$/, "");
const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "demo-user";

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.ok) {
    throw new Error(`${payload.error.code}: ${payload.error.message}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return payload.data;
}

function classNames(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ");
}

function matchesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

function Icon({ name, className = "icon" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, JSX.Element> = {
    activity: (
      <>
        <path d="M4 12h3l2-5 4 10 2-5h5" />
      </>
    ),
    check: (
      <>
        <path d="M5 12.5 10 17l9-10" />
      </>
    ),
    chevronDown: (
      <>
        <path d="m7 10 5 5 5-5" />
      </>
    ),
    chevronUp: (
      <>
        <path d="m7 14 5-5 5 5" />
      </>
    ),
    home: (
      <>
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6.5 10v9h11v-9" />
        <path d="M10 19v-5h4v5" />
      </>
    ),
    layers: (
      <>
        <path d="m12 4 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 16 8 4 8-4" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    notebook: (
      <>
        <path d="M7 4.5h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" />
        <path d="M9 4.5v15" />
        <path d="M12 8h4" />
        <path d="M12 12h4" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    qa: (
      <>
        <path d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v6A2.5 2.5 0 0 1 17 15H9l-4.5 4v-12.5Z" />
        <path d="M10 8.25a2.1 2.1 0 1 1 2 2.75v1" />
        <path d="M12 14.5h.01" />
      </>
    ),
    repeat: (
      <>
        <path d="M17.5 8.5A6.5 6.5 0 0 0 6.1 6.1L4 8.2" />
        <path d="M4 4.5v3.7h3.7" />
        <path d="M6.5 15.5a6.5 6.5 0 0 0 11.4 2.4L20 15.8" />
        <path d="M20 19.5v-3.7h-3.7" />
      </>
    ),
    search: (
      <>
        <path d="M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6Z" />
        <path d="m16 16 4 4" />
      </>
    ),
    spark: (
      <>
        <path d="M12 3.5 14.2 9 20 12l-5.8 3L12 20.5 9.8 15 4 12l5.8-3L12 3.5Z" />
      </>
    )
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [memos, setMemos] = useState<MemoSummary[]>([]);
  const [qaList, setQaList] = useState<QA[]>([]);
  const [repeatSubjects, setRepeatSubjects] = useState<RepeatSubject[]>([]);
  const [memoDetail, setMemoDetail] = useState<MemoDetail | null>(null);
  const [repeatDetail, setRepeatDetail] = useState<RepeatDetail | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedMemoId, setSelectedMemoId] = useState<number | null>(null);
  const [selectedRepeatSubjectId, setSelectedRepeatSubjectId] = useState<number | null>(null);
  const [expandedQaIds, setExpandedQaIds] = useState<Set<number>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const selectedTag = useMemo(
    () => tags.find((tag) => tag.tag_id === selectedTagId),
    [selectedTagId, tags]
  );
  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.subject_id === selectedSubjectId),
    [selectedSubjectId, subjects]
  );
  const filteredTags = useMemo(
    () =>
      normalizedSearch
        ? tags.filter((tag) => matchesSearch(tag.tag_name, normalizedSearch))
        : tags,
    [normalizedSearch, tags]
  );
  const filteredSubjects = useMemo(
    () =>
      normalizedSearch
        ? subjects.filter((subject) => matchesSearch(subject.subject_name, normalizedSearch))
        : subjects,
    [normalizedSearch, subjects]
  );
  const filteredMemos = useMemo(
    () =>
      normalizedSearch
        ? memos.filter((memo) => matchesSearch(memo.memo_name, normalizedSearch))
        : memos,
    [memos, normalizedSearch]
  );
  const filteredQaList = useMemo(
    () =>
      normalizedSearch
        ? qaList.filter((qa) =>
            [qa.question, qa.answer, qa.explanation].some((value) =>
              matchesSearch(value, normalizedSearch)
            )
          )
        : qaList,
    [normalizedSearch, qaList]
  );
  const dashboardStats = useMemo(
    () => [
      {
        icon: "repeat" as const,
        label: "復習キュー",
        meta: "説明できるか確認",
        value: repeatSubjects.length
      },
      {
        icon: "qa" as const,
        label: "一問一答",
        meta: "答えを隠して練習",
        value: qaList.length
      },
      {
        icon: "notebook" as const,
        label: "表示中メモ",
        meta: selectedSubject?.subject_name ?? "テーマ未選択",
        value: memos.length
      },
      {
        icon: "layers" as const,
        label: "学習タグ",
        meta: "分野ごとの入口",
        value: tags.length
      }
    ],
    [memos.length, qaList.length, repeatSubjects.length, selectedSubject?.subject_name, tags.length]
  );

  useEffect(() => {
    let isActive = true;

    async function loadInitialData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [nextTags, nextQaList, nextRepeatSubjects] = await Promise.all([
          fetchApi<Tag[]>(`/${DEMO_USER_ID}/tags`),
          fetchApi<QA[]>(`/${DEMO_USER_ID}/qa`),
          fetchApi<RepeatSubject[]>(`/${DEMO_USER_ID}/repeat`)
        ]);

        if (!isActive) {
          return;
        }

        setTags(nextTags);
        setQaList(nextQaList);
        setRepeatSubjects(nextRepeatSubjects);
        setSelectedTagId(nextTags[0]?.tag_id ?? null);
        setSelectedRepeatSubjectId(nextRepeatSubjects[0]?.subject_id ?? null);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "API request failed");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadSubjects() {
      if (selectedTagId === null) {
        setSubjects([]);
        setSelectedSubjectId(null);
        return;
      }

      setErrorMessage(null);

      try {
        const nextSubjects = await fetchApi<Subject[]>(
          `/${DEMO_USER_ID}/tags/${selectedTagId}`
        );

        if (!isActive) {
          return;
        }

        setSubjects(nextSubjects);
        setSelectedSubjectId(nextSubjects[0]?.subject_id ?? null);
        setSelectedMemoId(null);
        setMemoDetail(null);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "API request failed");
        }
      }
    }

    loadSubjects();

    return () => {
      isActive = false;
    };
  }, [selectedTagId]);

  useEffect(() => {
    let isActive = true;

    async function loadMemos() {
      if (selectedTagId === null || selectedSubjectId === null) {
        setMemos([]);
        setSelectedMemoId(null);
        return;
      }

      setErrorMessage(null);

      try {
        const nextMemos = await fetchApi<MemoSummary[]>(
          `/${DEMO_USER_ID}/tags/${selectedTagId}/${selectedSubjectId}`
        );

        if (!isActive) {
          return;
        }

        setMemos(nextMemos);
        setSelectedMemoId(nextMemos[0]?.memo_id ?? null);
        setMemoDetail(null);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "API request failed");
        }
      }
    }

    loadMemos();

    return () => {
      isActive = false;
    };
  }, [selectedSubjectId, selectedTagId]);

  useEffect(() => {
    let isActive = true;

    async function loadMemoDetail() {
      if (selectedTagId === null || selectedSubjectId === null || selectedMemoId === null) {
        setMemoDetail(null);
        return;
      }

      setErrorMessage(null);

      try {
        const nextMemoDetail = await fetchApi<MemoDetail>(
          `/${DEMO_USER_ID}/tags/${selectedTagId}/${selectedSubjectId}/${selectedMemoId}`
        );

        if (isActive) {
          setMemoDetail(nextMemoDetail);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "API request failed");
        }
      }
    }

    loadMemoDetail();

    return () => {
      isActive = false;
    };
  }, [selectedMemoId, selectedSubjectId, selectedTagId]);

  useEffect(() => {
    let isActive = true;

    async function loadRepeatDetail() {
      if (selectedRepeatSubjectId === null) {
        setRepeatDetail(null);
        return;
      }

      setErrorMessage(null);

      try {
        const nextRepeatDetail = await fetchApi<RepeatDetail>(
          `/${DEMO_USER_ID}/repeat/${selectedRepeatSubjectId}`
        );

        if (isActive) {
          setRepeatDetail(nextRepeatDetail);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "API request failed");
        }
      }
    }

    loadRepeatDetail();

    return () => {
      isActive = false;
    };
  }, [selectedRepeatSubjectId]);

  function handleSelectTag(tagId: number) {
    setSelectedTagId(tagId);
    setSelectedSubjectId(null);
    setSelectedMemoId(null);
    setSubjects([]);
    setMemos([]);
    setMemoDetail(null);
  }

  function handleSelectSubject(subjectId: number) {
    setSelectedSubjectId(subjectId);
    setSelectedMemoId(null);
    setMemos([]);
    setMemoDetail(null);
  }

  function handleSelectMemo(memoId: number) {
    setSelectedMemoId(memoId);
  }

  function handleSelectRepeatSubject(subjectId: number) {
    setSelectedRepeatSubjectId(subjectId);
  }

  function toggleQa(qaId: number) {
    setExpandedQaIds((current) => {
      const next = new Set(current);
      if (next.has(qaId)) {
        next.delete(qaId);
      } else {
        next.add(qaId);
      }
      return next;
    });
  }

  return (
    <div className="appFrame">
      <aside className="sidebar" aria-label="SynapseNote navigation">
        <div className="brand">
          <div className="brandMark">S</div>
          <div>
            <p>SynapseNote</p>
            <span>Study workspace</span>
          </div>
        </div>

        <nav className="sideNav" aria-label="Primary navigation">
          <p className="navGroupLabel">マイワーク</p>
          <button className="navItem navItemActive" type="button">
            <Icon name="home" />
            <span>ホーム</span>
          </button>
          <button className="navItem" type="button">
            <Icon name="notebook" />
            <span>ノート</span>
            <strong>{memos.length}</strong>
          </button>
          <button className="navItem" type="button">
            <Icon name="qa" />
            <span>一問一答</span>
            <strong>{qaList.length}</strong>
          </button>
          <button className="navItem" type="button">
            <Icon name="repeat" />
            <span>復習キュー</span>
            <strong>{repeatSubjects.length}</strong>
          </button>
          <button className="navItem" type="button">
            <Icon name="layers" />
            <span>タグ</span>
            <strong>{tags.length}</strong>
          </button>
        </nav>

        <div className="sidebarFooter">
          <button className="navItem compact" type="button">
            <Icon name="plus" />
            <span>学習を追加</span>
          </button>
          <button className="navItem compact" type="button">
            <Icon name="menu" />
            <span>サイドバーを折りたたむ</span>
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="globalHeader">
          <label className="searchBox">
            <Icon name="search" />
            <input
              aria-label="検索"
              placeholder="検索または移動先..."
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <kbd>/</kbd>
          </label>
          <div className="headerActions">
            <button className="iconButton" type="button" aria-label="新規作成">
              <Icon name="plus" />
            </button>
            <button className="iconButton" type="button" aria-label="今日のアクティビティ">
              <Icon name="activity" />
            </button>
            <div className="userAvatar" aria-label="demo user">
              SN
            </div>
          </div>
        </header>

        <main className="workspaceSurface">
          <div className="breadcrumb">
            <span>マイワーク</span>
            <span>/</span>
            <strong>ホーム</strong>
          </div>

          {errorMessage ? <p className="errorBanner">{errorMessage}</p> : null}

          <section className="profileStrip" aria-label="workspace summary">
            <div className="profileAvatar">S</div>
            <div className="profileText">
              <p className="eyebrow">今日の学習</p>
              <h1>Shota Sasaki</h1>
              <p>
                ノートを見返し、答えを隠した一問一答で確認し、復習キューから忘れかけたテーマへ戻ります。
              </p>
            </div>
            <div className="apiStatus">
              <span className={classNames("statusDot", errorMessage ? "statusDotError" : null)} />
              {errorMessage ? "API error" : isLoading ? "Loading" : "API connected"}
            </div>
          </section>

          <section className="overviewRow" aria-label="learning overview">
            <div className="statGrid">
              {dashboardStats.map((stat) => (
                <article className="statCard" key={stat.label}>
                  <header>
                    <span>{stat.label}</span>
                    <Icon name={stat.icon} />
                  </header>
                  <strong>{stat.value}</strong>
                  <p>{stat.meta}</p>
                </article>
              ))}
            </div>

            <aside className="quickAccess" aria-label="quick access">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Quick access</p>
                  <h2>クイックアクセス</h2>
                </div>
              </div>
              <div className="quickTabs" role="tablist" aria-label="quick access tabs">
                <button className="quickTabActive" type="button">
                  最近表示したもの
                </button>
                <button type="button">プロジェクト</button>
              </div>
              <dl className="quickList">
                <div>
                  <dt>現在のタグ</dt>
                  <dd>{selectedTag?.tag_name ?? "未選択"}</dd>
                </div>
                <div>
                  <dt>現在のテーマ</dt>
                  <dd>{selectedSubject?.subject_name ?? "未選択"}</dd>
                </div>
                <div>
                  <dt>開いているメモ</dt>
                  <dd>{memoDetail?.memo_name ?? "未選択"}</dd>
                </div>
              </dl>
            </aside>
          </section>

          <section className="contentGrid" aria-label="SynapseNote dashboard">
            <section className="panel notesPanel" aria-labelledby="notes-heading">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Notebook</p>
                  <h2 id="notes-heading">ノート一覧</h2>
                </div>
                <span className="panelMeta">{selectedTag?.tag_name ?? "タグ未選択"}</span>
              </div>

              <div className="browserGrid">
                <div className="browserColumn">
                  <h3>Tags</h3>
                  <div className="stack">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag.tag_id}
                        className={classNames(
                          "selectItem",
                          selectedTagId === tag.tag_id && "selectItemActive"
                        )}
                        type="button"
                        onClick={() => handleSelectTag(tag.tag_id)}
                      >
                        <span>{tag.tag_name}</span>
                      </button>
                    ))}
                    {filteredTags.length === 0 ? <p className="emptyText">タグがありません。</p> : null}
                  </div>
                </div>

                <div className="browserColumn">
                  <h3>Subjects</h3>
                  <div className="stack">
                    {filteredSubjects.map((subject) => (
                      <button
                        key={subject.subject_id}
                        className={classNames(
                          "selectItem",
                          selectedSubjectId === subject.subject_id && "selectItemActive"
                        )}
                        type="button"
                        onClick={() => handleSelectSubject(subject.subject_id)}
                      >
                        <span>{subject.subject_name}</span>
                      </button>
                    ))}
                    {filteredSubjects.length === 0 ? (
                      <p className="emptyText">テーマがありません。</p>
                    ) : null}
                  </div>
                </div>

                <div className="browserColumn">
                  <h3>Memos</h3>
                  <div className="stack">
                    {filteredMemos.map((memo) => (
                      <button
                        key={memo.memo_id}
                        className={classNames(
                          "selectItem",
                          selectedMemoId === memo.memo_id && "selectItemActive"
                        )}
                        type="button"
                        onClick={() => handleSelectMemo(memo.memo_id)}
                      >
                        <span>{memo.memo_name}</span>
                      </button>
                    ))}
                    {filteredMemos.length === 0 ? <p className="emptyText">メモがありません。</p> : null}
                  </div>
                </div>
              </div>

              <article className="memoDetail">
                <div>
                  <p className="muted">
                    {selectedTag?.tag_name ?? "Tag"} / {selectedSubject?.subject_name ?? "Subject"}
                  </p>
                  <h3>{memoDetail?.memo_name ?? "メモを選択"}</h3>
                </div>
                <p>{memoDetail?.memo_detail ?? "左のリストからメモを選んでください。"}</p>
              </article>
            </section>

            <section className="panel qaPanel" aria-labelledby="qa-heading">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Question Answer</p>
                  <h2 id="qa-heading">一問一答</h2>
                </div>
                <span className="panelMeta">{filteredQaList.length} 問</span>
              </div>

              <div className="qaList">
                {filteredQaList.map((qa, index) => {
                  const isExpanded = expandedQaIds.has(qa.qa_id);

                  return (
                    <article className={classNames("qaCard", isExpanded && "qaCardOpen")} key={qa.qa_id}>
                      <div className="qaQuestionRow">
                        <span className="qaNumber">Q{index + 1}</span>
                        <p className="question">{qa.question}</p>
                      </div>
                      <button
                        aria-expanded={isExpanded}
                        className="answerToggle"
                        type="button"
                        onClick={() => toggleQa(qa.qa_id)}
                      >
                        <Icon name={isExpanded ? "chevronUp" : "chevronDown"} />
                        {isExpanded ? "閉じる" : "答えを見る"}
                      </button>
                      {isExpanded ? (
                        <div className="qaReveal">
                          <div>
                            <p className="answerLabel">答え</p>
                            <p className="answerText">{qa.answer}</p>
                          </div>
                          <div>
                            <p className="answerLabel">解説</p>
                            <p className="answerText">{qa.explanation}</p>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
                {filteredQaList.length === 0 ? <p className="emptyText">一致する問題がありません。</p> : null}
              </div>
            </section>

            <section className="panel reviewPanel" aria-labelledby="review-heading">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Recall Check</p>
                  <h2 id="review-heading">注意が必要なアイテム</h2>
                </div>
                <button className="filterButton" type="button">
                  すべて
                  <Icon name="chevronDown" />
                </button>
              </div>

              <div className="reviewList">
                {repeatSubjects.map((subject) => (
                  <article
                    className={classNames(
                      "reviewItem",
                      selectedRepeatSubjectId === subject.subject_id && "reviewItemActive"
                    )}
                    key={subject.subject_id}
                  >
                    <div>
                      <p>復習テーマ</p>
                      <h3>{subject.subject_name}</h3>
                      <span>
                        {selectedRepeatSubjectId === subject.subject_id
                          ? repeatDetail?.subject_detail
                          : "説明できるかを確認する"}
                      </span>
                    </div>
                    <button
                      className="reviewAction"
                      type="button"
                      onClick={() => handleSelectRepeatSubject(subject.subject_id)}
                      aria-label={`${subject.subject_name} を復習する`}
                    >
                      <Icon name="check" />
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel activityPanel" aria-labelledby="activity-heading">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Activity</p>
                  <h2 id="activity-heading">最新の更新をフォロー</h2>
                </div>
              </div>
              <div className="timeline">
                <div className="timelineDot" />
                <div>
                  <p>
                    <strong>{memoDetail?.memo_name ?? "ノート"}</strong> を表示中
                  </p>
                  <span>{selectedSubject?.subject_name ?? "テーマを選択してください"}</span>
                </div>
              </div>
              <div className="timeline">
                <div className="timelineDot mutedDot" />
                <div>
                  <p>
                    <strong>{repeatDetail?.subject_name ?? "復習テーマ"}</strong> を確認対象に追加
                  </p>
                  <span>忘れる前にもう一度説明する</span>
                </div>
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
