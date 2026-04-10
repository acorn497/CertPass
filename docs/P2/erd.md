# ERD (Entity Relationship Diagram)

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | CertPass |
| 단계 | P2 |
| 데이터베이스 | MongoDB (Mongoose ODM) |
| 작성일 | 2026-04-10 |

---

## P2 변경 사항 요약

| 컬렉션 | 변경 내용 |
|--------|---------|
| users | `refreshToken`, `isEmailVerified`, `emailVerifyToken` 필드 추가 |
| courses | `instructor_id` (User 참조) 추가, `status` 필드로 승인 상태 관리 |
| reviews | **신규** — 강의 리뷰·평점 |
| questions | **신규** — 모의고사 문항 |
| exams | **신규** — 모의고사 세트 |
| exam_attempts | **신규** — 응시 기록 |
| qna_posts | **신규** — Q&A 질문 |
| qna_comments | **신규** — Q&A 답변 |

---

## dbdiagram.io 코드

```dbml
// CertPass P2 ERD
// MongoDB 컬렉션 기반 관계형 표현 (dbdiagram.io)

Table users {
  _id               ObjectId  [pk]
  email             string    [unique, not null]
  password          string    [note: "소셜 로그인 시 null 허용"]
  name              string    [not null]
  role              string    [not null, default: "student", note: "student | instructor | admin"]
  profileImage      string
  refreshToken      string    [note: "해시된 Refresh Token, 로그아웃 시 null"]
  isEmailVerified   boolean   [not null, default: false]
  emailVerifyToken  string    [note: "이메일 인증 토큰, 인증 완료 시 null"]
  oauthProvider     string    [note: "google | null"]
  oauthId           string    [note: "OAuth 제공자의 사용자 ID"]
  createdAt         datetime  [not null]
  updatedAt         datetime  [not null]
}

Table categories {
  _id       ObjectId  [pk]
  name      string    [unique, not null]
  slug      string    [unique, not null]
  createdAt datetime  [not null]
}

Table courses {
  _id           ObjectId  [pk]
  title         string    [not null]
  description   string    [not null]
  thumbnail     string
  instructor_id ObjectId  [ref: > users._id, not null, note: "P2부터 User 참조"]
  instructor    string    [not null, note: "강사명 문자열 (역정규화)"]
  category_id   ObjectId  [ref: > categories._id]
  examName      string    [not null]
  level         string    [not null, note: "beginner | intermediate | advanced"]
  price         number    [not null, default: 0]
  status        string    [not null, default: "pending", note: "pending | approved | rejected"]
  totalDuration number
  avgRating     number    [note: "평균 평점 (역정규화, 리뷰 작성 시 갱신)"]
  reviewCount   number    [default: 0]
  createdAt     datetime  [not null]
  updatedAt     datetime  [not null]
}

Table sections {
  _id       ObjectId  [pk]
  course_id ObjectId  [ref: > courses._id, not null]
  title     string    [not null]
  order     number    [not null]
  createdAt datetime  [not null]
}

Table episodes {
  _id        ObjectId  [pk]
  section_id ObjectId  [ref: > sections._id, not null]
  course_id  ObjectId  [ref: > courses._id, not null]
  title      string    [not null]
  videoUrl   string    [not null]
  duration   number    [not null]
  order      number    [not null]
  createdAt  datetime  [not null]
}

Table enrollments {
  _id        ObjectId  [pk]
  user_id    ObjectId  [ref: > users._id, not null]
  course_id  ObjectId  [ref: > courses._id, not null]
  enrolledAt datetime  [not null]
  note: "복합 유니크: (user_id, course_id)"
}

Table progresses {
  _id         ObjectId  [pk]
  user_id     ObjectId  [ref: > users._id, not null]
  course_id   ObjectId  [ref: > courses._id, not null]
  episode_id  ObjectId  [ref: > episodes._id, not null]
  isCompleted boolean   [not null, default: false]
  watchedAt   datetime
  note: "복합 유니크: (user_id, episode_id)"
}

Table reviews {
  _id       ObjectId  [pk]
  user_id   ObjectId  [ref: > users._id, not null]
  course_id ObjectId  [ref: > courses._id, not null]
  rating    number    [not null, note: "1 ~ 5"]
  content   string    [not null]
  createdAt datetime  [not null]
  updatedAt datetime  [not null]
  note: "복합 유니크: (user_id, course_id)"
}

Table exams {
  _id         ObjectId  [pk]
  course_id   ObjectId  [ref: > courses._id, not null]
  title       string    [not null]
  description string
  timeLimit   number    [note: "제한 시간(분), null이면 무제한"]
  createdAt   datetime  [not null]
}

Table questions {
  _id        ObjectId  [pk]
  exam_id    ObjectId  [ref: > exams._id, not null]
  content    string    [not null, note: "문항 내용"]
  options    string[]  [not null, note: "4개 선택지 배열"]
  answer     number    [not null, note: "정답 인덱스 (0~3)"]
  explanation string   [note: "해설"]
  order      number    [not null]
  createdAt  datetime  [not null]
}

Table exam_attempts {
  _id           ObjectId  [pk]
  user_id       ObjectId  [ref: > users._id, not null]
  exam_id       ObjectId  [ref: > exams._id, not null]
  answers       object[]  [note: "[{ questionId, selected }]"]
  score         number    [not null, note: "점수 (0~100)"]
  correctCount  number    [not null]
  totalCount    number    [not null]
  completedAt   datetime  [not null]
}

Table qna_posts {
  _id       ObjectId  [pk]
  user_id   ObjectId  [ref: > users._id, not null]
  course_id ObjectId  [ref: > courses._id, not null]
  title     string    [not null]
  content   string    [not null]
  isResolved boolean  [not null, default: false]
  createdAt datetime  [not null]
  updatedAt datetime  [not null]
}

Table qna_comments {
  _id       ObjectId  [pk]
  post_id   ObjectId  [ref: > qna_posts._id, not null]
  user_id   ObjectId  [ref: > users._id, not null]
  content   string    [not null]
  isInstructor boolean [not null, default: false]
  createdAt datetime  [not null]
}
```

---

## 컬렉션 상세 설명

### users (변경)
- `refreshToken`: bcrypt 해시로 저장. 로그아웃 시 null로 설정.
- `isEmailVerified`: 이메일 인증 여부. false인 경우 수강 신청 불가.
- `oauthProvider` / `oauthId`: Google 소셜 로그인 연동 정보.

### courses (변경)
- `instructor_id`: P2부터 강사 User 참조. `instructor` 문자열은 역정규화로 유지.
- `status`: `pending`(승인 대기) → `approved`(승인) → 수강생에게 노출. `rejected`(반려).
- `avgRating` / `reviewCount`: 리뷰 작성·수정·삭제 시 실시간 갱신.

### reviews (신규)
- 강의당 수강생 1개 리뷰. `(user_id, course_id)` 복합 유니크 인덱스.
- 리뷰 작성/수정 시 courses.avgRating, reviewCount 업데이트.

### exams / questions (신규)
- 강의 1개에 여러 모의고사 세트 가능.
- `questions.options`: 4개 선택지 문자열 배열.
- `questions.answer`: 정답 인덱스 (0~3). 클라이언트로 전송하지 않음.

### exam_attempts (신규)
- 응시 1회당 1개 문서. 재응시 가능 (복합 유니크 없음).
- `answers`: `[{ questionId: ObjectId, selected: number }]` 형태로 저장.

### qna_posts / qna_comments (신규)
- 강의별 Q&A 게시판.
- `qna_comments.isInstructor`: 답변이 강사 본인인지 마킹 (강조 표시용).
