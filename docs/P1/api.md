# API 엔드포인트 명세서

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | CertPass |
| 단계 | P1 (MVP) |
| Base URL | `/api/v1` |
| 인증 방식 | JWT Bearer Token (`Authorization: Bearer <token>`) |
| 작성일 | 2026-03-12 |

---

## 공통 응답 형식

### 성공
```json
{
  "success": true,
  "data": { ... }
}
```

### 실패
```json
{
  "success": false,
  "message": "에러 메시지"
}
```

---

## 인증 범례

| 아이콘 | 의미 |
|--------|------|
| (공개) | 인증 없이 접근 가능 |
| (인증) | JWT Access Token 필요 |

---

## 1. 인증 (Auth)

### POST `/api/v1/auth/register` (공개)
회원가입

**Request Body**
```json
{
  "email": "student@example.com",
  "password": "password1234",
  "name": "홍길동"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "student@example.com",
      "name": "홍길동",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

**에러 케이스**
| 상태코드 | 메시지 |
|---------|--------|
| 400 | 필수 입력값 누락 또는 형식 오류 |
| 409 | 이미 사용 중인 이메일 |

---

### POST `/api/v1/auth/login` (공개)
로그인

**Request Body**
```json
{
  "email": "student@example.com",
  "password": "password1234"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "student@example.com",
      "name": "홍길동",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

**에러 케이스**
| 상태코드 | 메시지 |
|---------|--------|
| 400 | 필수 입력값 누락 |
| 401 | 이메일 또는 비밀번호가 올바르지 않습니다 |

---

## 2. 사용자 (Users)

### GET `/api/v1/users/me` (인증)
내 프로필 조회

**Response 200**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "student@example.com",
    "name": "홍길동",
    "role": "student",
    "profileImage": null,
    "createdAt": "2026-03-12T00:00:00.000Z"
  }
}
```

---

### PATCH `/api/v1/users/me` (인증)
내 프로필 수정 (이름)

**Request Body**
```json
{
  "name": "김길동"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "student@example.com",
    "name": "김길동"
  }
}
```

---

### PATCH `/api/v1/users/me/password` (인증)
비밀번호 변경

**Request Body**
```json
{
  "currentPassword": "password1234",
  "newPassword": "newpassword5678"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "message": "비밀번호가 변경되었습니다."
  }
}
```

**에러 케이스**
| 상태코드 | 메시지 |
|---------|--------|
| 400 | 새 비밀번호 형식 오류 |
| 401 | 현재 비밀번호가 올바르지 않습니다 |

---

## 3. 카테고리 (Categories)

### GET `/api/v1/categories` (공개)
자격증 분야 카테고리 목록 조회

**Response 200**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "IT", "slug": "it" },
    { "_id": "...", "name": "경제/금융", "slug": "finance" },
    { "_id": "...", "name": "어학", "slug": "language" },
    { "_id": "...", "name": "건설/부동산", "slug": "construction" },
    { "_id": "...", "name": "의료/보건", "slug": "medical" },
    { "_id": "...", "name": "법률/행정", "slug": "legal" }
  ]
}
```

---

## 4. 강의 (Courses)

### GET `/api/v1/courses` (공개)
강의 목록 조회

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `page` | number | 아니오 | 페이지 번호 (기본값: 1) |
| `limit` | number | 아니오 | 페이지당 항목 수 (기본값: 12) |
| `category` | string | 아니오 | 카테고리 slug로 필터링 (예: `it`, `finance`) |
| `level` | string | 아니오 | `beginner` / `intermediate` / `advanced` |

**Response 200**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "_id": "...",
        "title": "정보처리기사 완벽 대비 올인원",
        "thumbnail": "https://cdn.example.com/courses/ipc.jpg",
        "instructor": "김강사",
        "category": { "_id": "...", "name": "IT" },
        "examName": "정보처리기사",
        "level": "beginner",
        "price": 0,
        "totalDuration": 72000,
        "episodeCount": 80
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 12,
      "totalPages": 4
    }
  }
}
```

---

### GET `/api/v1/courses/:courseId` (공개)
강의 상세 조회 (커리큘럼 포함)

**Response 200**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "정보처리기사 완벽 대비 올인원",
    "description": "필기부터 실기까지 한 번에 끝내는 정보처리기사 강의",
    "thumbnail": "https://cdn.example.com/courses/ipc.jpg",
    "instructor": "김강사",
    "category": { "_id": "...", "name": "IT" },
    "examName": "정보처리기사",
    "level": "beginner",
    "price": 0,
    "totalDuration": 72000,
    "sections": [
      {
        "_id": "...",
        "title": "1과목. 소프트웨어 설계",
        "order": 1,
        "episodes": [
          {
            "_id": "...",
            "title": "1-1. 소프트웨어 생명주기 모델",
            "duration": 720,
            "order": 1
          }
        ]
      }
    ]
  }
}
```

**에러 케이스**
| 상태코드 | 메시지 |
|---------|--------|
| 404 | 강의를 찾을 수 없습니다 |

---

## 5. 수강 신청 (Enrollments)

### POST `/api/v1/enrollments` (인증)
수강 신청

**Request Body**
```json
{
  "courseId": "..."
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user_id": "...",
    "course_id": "...",
    "enrolledAt": "2026-03-12T00:00:00.000Z"
  }
}
```

**에러 케이스**
| 상태코드 | 메시지 |
|---------|--------|
| 400 | 이미 수강 신청한 강의입니다 |
| 404 | 강의를 찾을 수 없습니다 |

---

### GET `/api/v1/enrollments/me` (인증)
내 수강 강의 목록 조회 (내 강의실)

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "enrollment": {
        "_id": "...",
        "enrolledAt": "2026-03-12T00:00:00.000Z"
      },
      "course": {
        "_id": "...",
        "title": "정보처리기사 완벽 대비 올인원",
        "thumbnail": "https://cdn.example.com/courses/ipc.jpg",
        "instructor": "김강사",
        "examName": "정보처리기사"
      },
      "progress": {
        "completedCount": 10,
        "totalCount": 80,
        "percentage": 12.5,
        "lastWatchedEpisodeId": "..."
      }
    }
  ]
}
```

---

### GET `/api/v1/enrollments/me/:courseId` (인증)
특정 강의 수강 여부 확인

**Response 200**
```json
{
  "success": true,
  "data": {
    "isEnrolled": true,
    "enrolledAt": "2026-03-12T00:00:00.000Z"
  }
}
```

---

## 6. 학습 진도 (Progress)

### GET `/api/v1/progress/:courseId` (인증)
강의별 에피소드 진도 목록 조회

**Response 200**
```json
{
  "success": true,
  "data": {
    "courseId": "...",
    "completedEpisodeIds": ["...", "...", "..."],
    "totalCount": 80,
    "completedCount": 10,
    "percentage": 12.5
  }
}
```

---

### POST `/api/v1/progress` (인증)
에피소드 시청 완료 처리

**Request Body**
```json
{
  "courseId": "...",
  "episodeId": "..."
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "user_id": "...",
    "course_id": "...",
    "episode_id": "...",
    "isCompleted": true,
    "watchedAt": "2026-03-12T01:30:00.000Z"
  }
}
```

**에러 케이스**
| 상태코드 | 메시지 |
|---------|--------|
| 403 | 수강 신청된 강의가 아닙니다 |
| 404 | 에피소드를 찾을 수 없습니다 |

---

## 7. 강의 영상 (Episodes)

### GET `/api/v1/courses/:courseId/episodes/:episodeId` (인증)
에피소드 영상 URL 조회 (수강생 전용)

**Response 200**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "1-1. 소프트웨어 생명주기 모델",
    "videoUrl": "dQw4w9WgXcQ",
    "duration": 720,
    "section": {
      "_id": "...",
      "title": "1과목. 소프트웨어 설계",
      "order": 1
    },
    "order": 1
  }
}
```

**에러 케이스**
| 상태코드 | 메시지 |
|---------|--------|
| 403 | 수강 신청 후 시청할 수 있습니다 |
| 404 | 에피소드를 찾을 수 없습니다 |

---

## 전체 엔드포인트 요약

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/auth/register` | 공개 | 회원가입 |
| POST | `/api/v1/auth/login` | 공개 | 로그인 |
| GET | `/api/v1/users/me` | 인증 | 내 프로필 조회 |
| PATCH | `/api/v1/users/me` | 인증 | 프로필 수정 |
| PATCH | `/api/v1/users/me/password` | 인증 | 비밀번호 변경 |
| GET | `/api/v1/categories` | 공개 | 자격증 분야 카테고리 목록 |
| GET | `/api/v1/courses` | 공개 | 강의 목록 |
| GET | `/api/v1/courses/:courseId` | 공개 | 강의 상세 |
| GET | `/api/v1/courses/:courseId/episodes/:episodeId` | 인증 | 에피소드 영상 조회 |
| POST | `/api/v1/enrollments` | 인증 | 수강 신청 |
| GET | `/api/v1/enrollments/me` | 인증 | 내 강의실 조회 |
| GET | `/api/v1/enrollments/me/:courseId` | 인증 | 수강 여부 확인 |
| GET | `/api/v1/progress/:courseId` | 인증 | 강의 진도 조회 |
| POST | `/api/v1/progress` | 인증 | 에피소드 완료 처리 |
