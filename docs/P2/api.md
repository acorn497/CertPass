# API 엔드포인트 명세서

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | CertPass |
| 단계 | P2 |
| Base URL | `/api/v1` |
| 인증 방식 | JWT Bearer Access Token + HttpOnly Refresh Token 쿠키 |
| 작성일 | 2026-04-10 |

---

## 공통 응답 형식

### 성공
```json
{ "success": true, "data": { ... } }
```

### 실패
```json
{ "success": false, "message": "에러 메시지" }
```

---

## 인증 범례

| 표시 | 의미 |
|------|------|
| (공개) | 인증 없이 접근 가능 |
| (인증) | JWT Access Token 필요 |
| (강사) | instructor 또는 admin 역할 필요 |
| (관리자) | admin 역할 필요 |

---

## 1. 인증 (Auth) — P1 기존 + 신규

### POST `/api/v1/auth/register` (공개) — 변경
회원가입 후 이메일 인증 메일 발송

**Request Body**
```json
{ "email": "...", "password": "...", "name": "..." }
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "email": "...", "name": "...", "role": "student" },
    "accessToken": "eyJ...",
    "message": "인증 이메일이 발송되었습니다."
  }
}
```

---

### POST `/api/v1/auth/login` (공개) — 변경
로그인. Refresh Token은 HttpOnly 쿠키로 설정.

**Response 200**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "email": "...", "name": "...", "role": "student" },
    "accessToken": "eyJ..."
  }
}
```
> Set-Cookie: `refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`

---

### POST `/api/v1/auth/refresh` (공개) — 신규
Refresh Token으로 새 Access Token 발급

**Request**: 쿠키의 refreshToken 자동 전송

**Response 200**
```json
{ "success": true, "data": { "accessToken": "eyJ..." } }
```

**에러 케이스**
| 상태코드 | 메시지 |
|---------|--------|
| 401 | Refresh Token이 유효하지 않습니다 |

---

### POST `/api/v1/auth/logout` (인증) — 신규
로그아웃. 서버에서 Refresh Token 무효화.

**Response 200**
```json
{ "success": true, "data": { "message": "로그아웃되었습니다." } }
```

---

### GET `/api/v1/auth/verify-email?token=...` (공개) — 신규
이메일 인증 링크 처리

**Response 200**
```json
{ "success": true, "data": { "message": "이메일 인증이 완료되었습니다." } }
```

---

### GET `/api/v1/auth/google` (공개) — 신규
Google OAuth 로그인 시작 (리다이렉트)

### GET `/api/v1/auth/google/callback` (공개) — 신규
Google OAuth 콜백. 로그인 성공 시 프론트엔드로 리다이렉트 (Access Token 포함)

---

## 2. 사용자 (Users) — P1 기존

기존 P1 API 유지 (GET `/api/v1/users/me`, PATCH, PATCH password)

### GET `/api/v1/users` (관리자) — 신규
전체 회원 목록 조회

**Query Parameters**: `page`, `limit`, `role`

**Response 200**
```json
{
  "success": true,
  "data": {
    "users": [{ "_id": "...", "email": "...", "name": "...", "role": "student", "createdAt": "..." }],
    "pagination": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
  }
}
```

---

### PATCH `/api/v1/users/:userId/role` (관리자) — 신규
회원 역할 변경

**Request Body**
```json
{ "role": "instructor" }
```

**Response 200**
```json
{ "success": true, "data": { "_id": "...", "role": "instructor" } }
```

---

## 3. 카테고리 (Categories)

### GET `/api/v1/categories` (공개) — P1 유지

### POST `/api/v1/categories` (관리자) — 신규
```json
{ "name": "의료/보건", "slug": "medical" }
```

### PATCH `/api/v1/categories/:categoryId` (관리자) — 신규

### DELETE `/api/v1/categories/:categoryId` (관리자) — 신규

---

## 4. 강의 (Courses)

### GET `/api/v1/courses` (공개) — 변경
검색 파라미터 추가: `q` (전문 검색)

**Query Parameters**: `page`, `limit`, `category`, `level`, `q`

---

### GET `/api/v1/courses/:courseId` (공개) — 변경
응답에 `avgRating`, `reviewCount`, `status` 필드 추가

---

### POST `/api/v1/courses` (강사) — 신규
강의 등록

**Request Body**
```json
{
  "title": "...",
  "description": "...",
  "categoryId": "...",
  "examName": "...",
  "level": "beginner"
}
```

**Response 201**
```json
{ "success": true, "data": { "_id": "...", "status": "pending", ... } }
```

---

### PATCH `/api/v1/courses/:courseId` (강사) — 신규
강의 수정 (본인 강의만)

---

### DELETE `/api/v1/courses/:courseId` (강사) — 신규
강의 삭제 (본인 강의만, pending/rejected 상태만 가능)

---

### PATCH `/api/v1/courses/:courseId/status` (관리자) — 신규
강의 승인/반려

**Request Body**
```json
{ "status": "approved" }
```

---

### POST `/api/v1/courses/:courseId/thumbnail` (강사) — 신규
썸네일 이미지 업로드 (multipart/form-data)

**Response 200**
```json
{ "success": true, "data": { "thumbnail": "https://s3.example.com/..." } }
```

---

## 5. 섹션 & 에피소드 (Sections & Episodes)

### POST `/api/v1/courses/:courseId/sections` (강사) — 신규
섹션 추가

**Request Body**
```json
{ "title": "1과목. 소프트웨어 설계", "order": 1 }
```

---

### PATCH `/api/v1/courses/:courseId/sections/:sectionId` (강사) — 신규
### DELETE `/api/v1/courses/:courseId/sections/:sectionId` (강사) — 신규

### POST `/api/v1/courses/:courseId/sections/:sectionId/episodes` (강사) — 신규
에피소드 추가

**Request Body**
```json
{ "title": "1-1. 소프트웨어 생명주기", "videoUrl": "dQw4w9WgXcQ", "duration": 720, "order": 1 }
```

### PATCH `/api/v1/courses/:courseId/sections/:sectionId/episodes/:episodeId` (강사) — 신규
### DELETE `/api/v1/courses/:courseId/sections/:sectionId/episodes/:episodeId` (강사) — 신규

---

## 6. 수강 신청 (Enrollments) — P1 유지

---

## 7. 학습 진도 (Progress) — P1 유지

---

## 8. 리뷰 (Reviews) — 신규

### GET `/api/v1/courses/:courseId/reviews` (공개)
강의 리뷰 목록

**Query Parameters**: `page`, `limit`

**Response 200**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "...",
        "user": { "_id": "...", "name": "홍길동" },
        "rating": 5,
        "content": "정말 좋은 강의입니다.",
        "createdAt": "..."
      }
    ],
    "avgRating": 4.7,
    "reviewCount": 23,
    "pagination": { "total": 23, "page": 1, "limit": 10, "totalPages": 3 }
  }
}
```

---

### POST `/api/v1/courses/:courseId/reviews` (인증)
리뷰 작성 (수강생 전용, 수강 중인 강의만)

**Request Body**
```json
{ "rating": 5, "content": "정말 좋은 강의입니다." }
```

**에러 케이스**
| 상태코드 | 메시지 |
|---------|--------|
| 403 | 수강 중인 강의에만 리뷰를 작성할 수 있습니다 |
| 409 | 이미 리뷰를 작성하셨습니다 |

---

### PATCH `/api/v1/courses/:courseId/reviews/:reviewId` (인증)
리뷰 수정 (본인만)

### DELETE `/api/v1/courses/:courseId/reviews/:reviewId` (인증)
리뷰 삭제 (본인 또는 관리자)

---

## 9. 모의고사 (Exams) — 신규

### GET `/api/v1/courses/:courseId/exams` (인증)
강의의 모의고사 목록

**Response 200**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "title": "1회 모의고사", "questionCount": 20, "timeLimit": 30 }
  ]
}
```

---

### POST `/api/v1/courses/:courseId/exams` (강사)
모의고사 세트 생성

**Request Body**
```json
{ "title": "1회 모의고사", "description": "...", "timeLimit": 30 }
```

---

### GET `/api/v1/exams/:examId/questions` (인증)
모의고사 문항 조회 (정답 제외)

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "content": "소프트웨어 생명주기 모델이 아닌 것은?",
      "options": ["폭포수 모델", "나선형 모델", "RAD 모델", "객체지향 모델"],
      "order": 1
    }
  ]
}
```

---

### POST `/api/v1/exams/:examId/questions` (강사)
문항 추가

**Request Body**
```json
{
  "content": "질문 내용",
  "options": ["선택1", "선택2", "선택3", "선택4"],
  "answer": 0,
  "explanation": "해설 내용",
  "order": 1
}
```

---

### POST `/api/v1/exams/:examId/attempts` (인증)
모의고사 응시 제출

**Request Body**
```json
{
  "answers": [
    { "questionId": "...", "selected": 0 },
    { "questionId": "...", "selected": 2 }
  ]
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "score": 85,
    "correctCount": 17,
    "totalCount": 20,
    "results": [
      { "questionId": "...", "selected": 0, "answer": 0, "isCorrect": true, "explanation": "..." }
    ]
  }
}
```

---

### GET `/api/v1/exams/:examId/attempts/me` (인증)
내 응시 기록 목록

---

## 10. Q&A — 신규

### GET `/api/v1/courses/:courseId/qna` (인증)
Q&A 목록

**Query Parameters**: `page`, `limit`

---

### POST `/api/v1/courses/:courseId/qna` (인증)
질문 등록

**Request Body**
```json
{ "title": "질문 제목", "content": "질문 내용" }
```

---

### GET `/api/v1/qna/:postId` (인증)
질문 상세 + 댓글

---

### POST `/api/v1/qna/:postId/comments` (인증)
댓글 작성

**Request Body**
```json
{ "content": "답변 내용" }
```

---

### PATCH `/api/v1/qna/:postId` (인증)
질문 수정 (본인만)

### DELETE `/api/v1/qna/:postId` (인증)
질문 삭제 (본인 또는 관리자)

---

## 11. 강사 대시보드 — 신규

### GET `/api/v1/instructor/courses` (강사)
내 강의 목록 (수강자 수, 평점 포함)

### GET `/api/v1/instructor/courses/:courseId/stats` (강사)
강의별 상세 통계 (에피소드 완료율, 수강자 진도 분포)

---

## 12. 관리자 (Admin) — 신규

### GET `/api/v1/admin/stats` (관리자)
대시보드 통계

**Response 200**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1200,
    "totalCourses": 45,
    "pendingCourses": 3,
    "todayEnrollments": 28
  }
}
```

---

## 전체 엔드포인트 요약 (P2 신규)

| 메서드 | 경로 | 역할 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/auth/refresh` | 공개 | Access Token 재발급 |
| POST | `/api/v1/auth/logout` | 인증 | 로그아웃 |
| GET | `/api/v1/auth/verify-email` | 공개 | 이메일 인증 |
| GET | `/api/v1/auth/google` | 공개 | Google OAuth 시작 |
| GET | `/api/v1/users` | 관리자 | 전체 회원 목록 |
| PATCH | `/api/v1/users/:id/role` | 관리자 | 역할 변경 |
| POST | `/api/v1/categories` | 관리자 | 카테고리 추가 |
| POST | `/api/v1/courses` | 강사 | 강의 등록 |
| PATCH | `/api/v1/courses/:id/status` | 관리자 | 강의 승인/반려 |
| POST | `/api/v1/courses/:id/sections` | 강사 | 섹션 추가 |
| POST | `.../sections/:id/episodes` | 강사 | 에피소드 추가 |
| GET | `/api/v1/courses/:id/reviews` | 공개 | 리뷰 목록 |
| POST | `/api/v1/courses/:id/reviews` | 인증 | 리뷰 작성 |
| GET | `/api/v1/courses/:id/exams` | 인증 | 모의고사 목록 |
| POST | `/api/v1/exams/:id/attempts` | 인증 | 모의고사 제출 |
| GET | `/api/v1/courses/:id/qna` | 인증 | Q&A 목록 |
| POST | `/api/v1/courses/:id/qna` | 인증 | 질문 등록 |
| POST | `/api/v1/qna/:id/comments` | 인증 | 댓글 작성 |
| GET | `/api/v1/instructor/courses` | 강사 | 내 강의 목록 |
| GET | `/api/v1/admin/stats` | 관리자 | 관리자 통계 |
