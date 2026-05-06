# Coding Voca — 데이터베이스 & 데이터 모델 설계

## 데이터베이스 선택: PostgreSQL

| 기준 | 근거 |
|---|---|
| 관계형 모델 | 단어 ↔ 카테고리 ↔ 프로그래밍언어 다대다 관계 |
| JSON 지원 | 코드 예시, 예문 등 유연한 구조 저장 |
| 전문 검색 | `tsvector` 한국어/영어 검색 지원 |
| 확장성 | 향후 사용자 계정, 학습 기록 등 확장 가능 |

---

## ERD (Entity Relationship Diagram)

```
┌──────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  categories  │     │      words         │     │ programming_     │
│  id (PK)     │◄──┐ │  id (PK)           │  ┌──│ languages        │
│  name        │   └─│  category_id (FK)  │  │  │  id (PK)         │
│  name_en     │     │  word / difficulty │  │  │  name / name_en  │
│  ...         │     │  everyday_meaning  │  │  │  ...             │
└──────────────┘     │  coding_meaning    │  │  └──────────────────┘
                     │  code_example      │  │
                     │  tags (JSONB)      │  │  ┌──────────────────┐
                     │  ...               │  │  │ word_languages   │
                     └────────────────────┘  ├──│  word_id (FK)    │
                            │  │  │           │  │  language_id (FK)│
                            │  │  │           │  └──────────────────┘
                            │  │  │           │
                     ┌──────┘  │  └──────┐   │  ┌──────────────────┐
                     │         │         │   │  │ related_words    │
                     ▼         │         ▼   │  │  word_id (FK)    │
              ┌─────────────┐  │  ┌──────────┘  │  related_word_id │
              │wordbook_    │  │  │wordbook_ │  └──────────────────┘
              │words        │  │  │words     │
              │wordbookId   │  │  │(same)    │  ┌──────────────────┐
              │wordId (FK)  │  │  └──────────┘  │ admins           │
              │memo         │  │                │  id / username   │
              └─────────────┘  │                │  password_hash   │
                     ▲         │                └──────────────────┘
                     │         │
              ┌─────────────┐  │                ┌──────────────────┐
              │ wordbooks   │  │                │ users            │
              │  id (PK)    │  │                │  id (PK)         │
              │  userId (FK)│◄─┼────────────────│  username        │
              │  name       │  │                │  email           │
              │  isPublic   │  │                │  password_hash   │
              └─────────────┘  │                └──────────────────┘
                     │         │                        │
              ┌──────┘         │                        │
              ▼                │                        │
       ┌──────────────┐        │                ┌───────┘
       │quiz_sessions │        │                │
       │  id (UUID,PK)│        │                │
       │  userId (FK) │◄───────┘                │
       │  wordbookId  │                          │
       │  mode        │◄─────────────────────────┘
       │  totalCount  │
       │  correctCount│
       └──────────────┘
              │
       ┌──────┘
       ▼
┌──────────────┐
│ quiz_results │
│  id (PK)     │
│  sessionId   │
│  wordId (FK) │
│  isCorrect   │
│  userAnswer  │
│  ...         │
└──────────────┘
```

---

## 테이블 상세 정의

### 1. `categories` (카테고리)

```sql
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,          -- "기초 문법"
    name_en     VARCHAR(100) NOT NULL,          -- "Basic Syntax"
    description TEXT,                            -- 카테고리 설명
    icon        VARCHAR(10),                     -- 이모지 "⌨️"
    color       VARCHAR(7),                      -- "#7c5cfc"
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### 2. `words` (단어)

```sql
CREATE TABLE words (
    id                  SERIAL PRIMARY KEY,
    word                VARCHAR(100) NOT NULL UNIQUE,  -- "variable"
    pronunciation_kr    VARCHAR(100) NOT NULL,         -- "배리어블"
    ipa                 VARCHAR(100),                  -- "/ˈvɛr.i.ə.bəl/"
    category_id         INTEGER REFERENCES categories(id),
    difficulty          VARCHAR(20) DEFAULT 'beginner', -- beginner/intermediate/advanced

    -- 일상 의미
    everyday_meaning    TEXT NOT NULL,                  -- "변하기 쉬운, 가변적인"
    everyday_example_en TEXT,                           -- "The weather is very variable."
    everyday_example_kr TEXT,                           -- "오늘 날씨가 매우 변덕스럽다."
    everyday_emoji      VARCHAR(10),                   -- "🌦️"

    -- 코딩 의미
    coding_meaning      TEXT NOT NULL,                  -- "변수 — 데이터를 저장하는 공간"
    coding_explanation  TEXT,                           -- 상세 설명
    coding_emoji        VARCHAR(10),                   -- "📦"

    -- 코드 예시
    code_example        TEXT,                           -- 코드 문자열
    code_language       VARCHAR(30),                   -- "python"
    code_explanation    TEXT,                           -- 코드 설명

    tags                JSONB DEFAULT '[]',            -- ["기초", "필수"]

    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_words_category ON words(category_id);
CREATE INDEX idx_words_word ON words(word);
CREATE INDEX idx_words_difficulty ON words(difficulty);
```

### 3. `programming_languages` (프로그래밍 언어)

```sql
CREATE TABLE programming_languages (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,            -- "Python"
    name_en     VARCHAR(50) NOT NULL,            -- "Python"
    icon        VARCHAR(10),                     -- "🐍"
    color       VARCHAR(7),                      -- "#3776AB"
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### 4. `word_languages` (단어 ↔ 프로그래밍 언어 다대다)

```sql
CREATE TABLE word_languages (
    id          SERIAL PRIMARY KEY,
    word_id     INTEGER REFERENCES words(id) ON DELETE CASCADE,
    language_id INTEGER REFERENCES programming_languages(id) ON DELETE CASCADE,
    relevance   VARCHAR(20) DEFAULT 'common',   -- common/specific/rare
    note        TEXT,                             -- "Python에서는 동적 타이핑"
    UNIQUE(word_id, language_id)
);
```

### 5. `related_words` (관련 단어 자기참조)

```sql
CREATE TABLE related_words (
    id              SERIAL PRIMARY KEY,
    word_id         INTEGER REFERENCES words(id) ON DELETE CASCADE,
    related_word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
    UNIQUE(word_id, related_word_id)
);
```

### 6. `admins` (관리자)

```sql
CREATE TABLE admins (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);
```

### 7. `users` (일반 사용자) — Phase 9 추가

```sql
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,   -- 영문/숫자/언더스코어 2~30자
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);
```

### 8. `wordbooks` (단어장) — Phase 10 추가

```sql
CREATE TABLE wordbooks (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_public   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_wordbooks_user ON wordbooks(user_id);
```

### 9. `wordbook_words` (단어장 ↔ 단어 다대다) — Phase 10 추가

```sql
CREATE TABLE wordbook_words (
    id          SERIAL PRIMARY KEY,
    wordbook_id INTEGER NOT NULL REFERENCES wordbooks(id) ON DELETE CASCADE,
    word_id     INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    memo        TEXT,                            -- 사용자 메모
    added_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE(wordbook_id, word_id)
);
```

### 10. `quiz_sessions` (퀴즈 세션) — Phase 11 추가

```sql
CREATE TABLE quiz_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       INTEGER NOT NULL REFERENCES users(id),
    wordbook_id   INTEGER NOT NULL REFERENCES wordbooks(id),
    mode          VARCHAR(10) NOT NULL,          -- meaning | spelling | mixed
    total_count   INTEGER NOT NULL,
    correct_count INTEGER DEFAULT 0,
    started_at    TIMESTAMP DEFAULT NOW(),
    completed_at  TIMESTAMP
);
CREATE INDEX idx_quiz_sessions_user ON quiz_sessions(user_id);
```

### 11. `quiz_results` (문항별 퀴즈 결과) — Phase 11 추가

```sql
CREATE TABLE quiz_results (
    id             SERIAL PRIMARY KEY,
    session_id     UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    word_id        INTEGER NOT NULL REFERENCES words(id),
    is_correct     BOOLEAN NOT NULL,
    user_answer    TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    answered_at    TIMESTAMP DEFAULT NOW()
);
```

---

## 검색 지원

PostgreSQL 전문 검색 또는 LIKE 기반 검색:

```sql
-- 영어 단어, 한국어 발음, 의미를 모두 검색
SELECT * FROM words
WHERE word ILIKE '%var%'
   OR pronunciation_kr ILIKE '%배리%'
   OR everyday_meaning ILIKE '%변%'
   OR coding_meaning ILIKE '%변수%';
```

향후 검색 성능이 필요할 경우 `tsvector` 전문 검색 인덱스를 추가할 수 있습니다.

---

## 시드 데이터 요약

초기 데이터로 **56개 단어**를 5개 카테고리에 분류합니다:

| 카테고리 | 단어 수 |
|---|---|
| 기초 문법 (basic-syntax) | 12 |
| 데이터 타입 (data-types) | 10 |
| 객체지향 (oop) | 10 |
| 웹 개발 (web-dev) | 9 |
| 일반/기타 (general) | 15 |
| **합계** | **56** |

시드 데이터의 상세 내용은 `05-sample-vocabulary.md`를 참조합니다.
