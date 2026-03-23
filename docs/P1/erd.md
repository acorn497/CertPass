# ERD (Entity Relationship Diagram)

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | CertPass |
| 단계 | P1 (MVP) |
| 데이터베이스 | MongoDB (Mongoose ODM) |
| 작성일 | 2026-03-12 |

---

## dbdiagram.io 코드

아래 코드를 [dbdiagram.io](https://dbdiagram.io) 에 붙여넣어 ERD를 시각화할 수 있습니다.

```dbml
// CertPass P1 ERD
// MongoDB 컬렉션 기반 관계형 표현 (dbdiagram.io)

Table users {
  _id         ObjectId  [pk, note: "MongoDB ObjectId"]
  email       string    [unique, not null, note: "로그인 이메일"]
  password    string    [not null, note: "bcrypt 해시"]
  name        string    [not null]
  role        string    [not null, default: "student", note: "student | instructor | admin (P2에서 확장)"]
  profileImage string   [note: "프로필 이미지 URL"]
  createdAt   datetime  [not null]
  updatedAt   datetime  [not null]
}

Table categories {
  _id         ObjectId  [pk]
  name        string    [unique, not null, note: "예: IT, 경제/금융, 어학, 건설/부동산, 의료/보건"]
  slug        string    [unique, not null, note: "URL 슬러그"]
  createdAt   datetime  [not null]
}

Table courses {
  _id           ObjectId  [pk]
  title         string    [not null, note: "강의 제목 (예: 정보처리기사 완벽 대비)"]
  description   string    [not null, note: "강의 소개"]
  thumbnail     string    [note: "썸네일 이미지 URL"]
  instructor    string    [not null, note: "강사 이름 (P1: 문자열, P2: User 참조)"]
  category_id   ObjectId  [ref: > categories._id, note: "자격증 분야"]
  examName      string    [not null, note: "자격증/시험명 (예: 정보처리기사, 토익, 공인중개사)"]
  level         string    [not null, note: "beginner | intermediate | advanced"]
  price         number    [not null, default: 0, note: "P1: 0(무료)만 허용"]
  isPublished   boolean   [not null, default: false]
  totalDuration number    [note: "전체 수강 시간(초)"]
  createdAt     datetime  [not null]
  updatedAt     datetime  [not null]
}

Table sections {
  _id        ObjectId  [pk]
  course_id  ObjectId  [ref: > courses._id, not null]
  title      string    [not null, note: "과목/섹션 제목 (예: 1과목. 소프트웨어 설계)"]
  order      number    [not null, note: "섹션 순서 (1부터 시작)"]
  createdAt  datetime  [not null]
}

Table episodes {
  _id        ObjectId  [pk]
  section_id ObjectId  [ref: > sections._id, not null]
  course_id  ObjectId  [ref: > courses._id, not null, note: "빠른 조회용 역정규화"]
  title      string    [not null, note: "에피소드 제목"]
  videoUrl   string    [not null, note: "YouTube 영상 ID (예: dQw4w9WgXcQ)"]
  duration   number    [not null, note: "영상 길이(초)"]
  order      number    [not null, note: "섹션 내 에피소드 순서"]
  createdAt  datetime  [not null]
}

Table enrollments {
  _id         ObjectId  [pk]
  user_id     ObjectId  [ref: > users._id, not null]
  course_id   ObjectId  [ref: > courses._id, not null]
  enrolledAt  datetime  [not null]
  note: "복합 유니크 인덱스: (user_id, course_id)"
}

Table progresses {
  _id          ObjectId  [pk]
  user_id      ObjectId  [ref: > users._id, not null]
  course_id    ObjectId  [ref: > courses._id, not null]
  episode_id   ObjectId  [ref: > episodes._id, not null]
  isCompleted  boolean   [not null, default: false]
  watchedAt    datetime  [note: "마지막 시청 시각"]
  note: "복합 유니크 인덱스: (user_id, episode_id)"
}
```

---

## 컬렉션 상세 설명

### users
수험생 계정 정보를 저장합니다.
- `role` 필드는 P1에서 `"student"` 고정. P2에서 `"instructor"`, `"admin"` 추가 예정.

### categories
자격증 분야 카테고리 목록입니다.

| 이름 | slug |
|------|------|
| IT | it |
| 경제/금융 | finance |
| 어학 | language |
| 건설/부동산 | construction |
| 의료/보건 | medical |
| 법률/행정 | legal |

### courses
강의 전체 정보를 저장합니다.
- `examName` 필드로 대상 자격증/시험명을 명시합니다. (예: 정보처리기사, 토익, 공인중개사)
- `instructor` 필드는 P1에서 단순 문자열로 저장. P2에서 `users` 컬렉션 참조로 변경 예정.
- `price`는 P1에서 `0`(무료)만 허용.

### sections
강의를 구성하는 과목/대단원(섹션)입니다.
- 자격증 시험의 과목 구성을 반영합니다. (예: 1과목. 소프트웨어 설계, 2과목. 소프트웨어 개발)
- `order`로 강의 내 섹션 순서를 관리합니다.

### episodes
섹션 내 개별 강의 영상(에피소드)입니다.
- `videoUrl`에는 YouTube 영상 ID를 저장하며, 플레이어에서 `https://www.youtube.com/embed/{videoUrl}` 형태로 임베드합니다.
- `course_id`를 포함하여 강의 단위 전체 에피소드 조회 시 sections를 거치지 않고 바로 조회 가능합니다.

### enrollments
수강 신청 내역입니다.
- `(user_id, course_id)` 복합 유니크 인덱스로 중복 수강 신청을 방지합니다.

### progresses
에피소드별 학습 진도를 저장합니다.
- `(user_id, episode_id)` 복합 유니크 인덱스로 중복 저장을 방지합니다.
- 강의 전체 진도율은 다음과 같이 계산합니다:

```
진도율(%) = (완료된 episode 수 / 전체 episode 수) × 100
```

---

## MongoDB JSON 구조 예시

### users 문서
```json
{
  "_id": "ObjectId('...')",
  "email": "student@example.com",
  "password": "$2b$10$...",
  "name": "홍길동",
  "role": "student",
  "profileImage": null,
  "createdAt": "2026-03-12T00:00:00.000Z",
  "updatedAt": "2026-03-12T00:00:00.000Z"
}
```

### courses 문서
```json
{
  "_id": "ObjectId('...')",
  "title": "정보처리기사 완벽 대비 올인원",
  "description": "필기부터 실기까지 한 번에 끝내는 정보처리기사 강의",
  "thumbnail": "https://cdn.example.com/courses/ipc.jpg",
  "instructor": "김강사",
  "category_id": "ObjectId('...')",
  "examName": "정보처리기사",
  "level": "beginner",
  "price": 0,
  "isPublished": true,
  "totalDuration": 72000,
  "createdAt": "2026-03-12T00:00:00.000Z",
  "updatedAt": "2026-03-12T00:00:00.000Z"
}
```

### sections 문서
```json
{
  "_id": "ObjectId('...')",
  "course_id": "ObjectId('...')",
  "title": "1과목. 소프트웨어 설계",
  "order": 1,
  "createdAt": "2026-03-12T00:00:00.000Z"
}
```

### episodes 문서
```json
{
  "_id": "ObjectId('...')",
  "section_id": "ObjectId('...')",
  "course_id": "ObjectId('...')",
  "title": "1-1. 소프트웨어 생명주기 모델",
  "videoUrl": "dQw4w9WgXcQ",
  "duration": 720,
  "order": 1,
  "createdAt": "2026-03-12T00:00:00.000Z"
}
```

### enrollments 문서
```json
{
  "_id": "ObjectId('...')",
  "user_id": "ObjectId('...')",
  "course_id": "ObjectId('...')",
  "enrolledAt": "2026-03-12T00:00:00.000Z"
}
```

### progresses 문서
```json
{
  "_id": "ObjectId('...')",
  "user_id": "ObjectId('...')",
  "course_id": "ObjectId('...')",
  "episode_id": "ObjectId('...')",
  "isCompleted": true,
  "watchedAt": "2026-03-12T01:30:00.000Z"
}
```
