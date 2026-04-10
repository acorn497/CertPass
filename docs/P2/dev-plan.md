# 개발계획서

## 프로젝트 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | CertPass |
| 단계 | P2 |
| 작성일 | 2026-04-10 |
| 작업 기간 | 2026-04-10 ~ |

---

## 개발 환경

### 공통 (P1 유지)
- 언어: TypeScript
- 패키지 매니저: npm
- 버전 관리: Git / GitHub

### 프론트엔드

| 항목 | 버전/내용 |
|------|----------|
| 프레임워크 | React 19 |
| 빌드 도구 | Vite |
| 스타일링 | Tailwind CSS v4.1 |
| 서버 상태 관리 | TanStack Query v5 |
| 클라이언트 상태 | Zustand |
| 라우팅 | React Router v6 |
| HTTP 클라이언트 | Axios (인터셉터에 토큰 재발급 로직 추가) |
| 폼 관리 | React Hook Form + Zod |

### 백엔드

| 항목 | 버전/내용 |
|------|----------|
| 런타임 | Node.js 24 LTS |
| 프레임워크 | NestJS |
| ODM | Mongoose 8 |
| 인증 | jsonwebtoken, bcrypt, Passport.js (Google OAuth) |
| 파일 업로드 | Multer + AWS S3 SDK |
| 이메일 | Nodemailer |
| 유효성 검사 | Zod |

---

## 프로젝트 디렉토리 구조

```
Project2/
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.ts
│   │   │   ├── courses.ts
│   │   │   ├── enrollments.ts
│   │   │   ├── progress.ts
│   │   │   ├── reviews.ts        # 신규
│   │   │   ├── exams.ts          # 신규
│   │   │   ├── qna.ts            # 신규
│   │   │   └── admin.ts          # 신규
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── course/
│   │   │   │   ├── CourseCard.tsx      # 평점 배지 추가
│   │   │   │   └── ReviewSection.tsx   # 신규
│   │   │   ├── exam/             # 신규
│   │   │   ├── qna/              # 신규
│   │   │   └── layout/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── CourseDetailPage.tsx    # 리뷰 섹션 추가
│   │   │   ├── PlayerPage.tsx
│   │   │   ├── MyCoursesPage.tsx
│   │   │   ├── MyPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ExamPage.tsx            # 신규
│   │   │   ├── ExamResultPage.tsx      # 신규
│   │   │   ├── QnaPage.tsx             # 신규
│   │   │   ├── instructor/
│   │   │   │   ├── InstructorDashboard.tsx    # 신규
│   │   │   │   ├── CourseFormPage.tsx          # 신규
│   │   │   │   └── CourseEditPage.tsx          # 신규
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx          # 신규
│   │   │       ├── AdminCoursesPage.tsx        # 신규
│   │   │       └── AdminUsersPage.tsx          # 신규
│   │   ├── hooks/
│   │   │   └── useTokenRefresh.ts      # 신규 (Axios 인터셉터 훅)
│   │   └── stores/
│   │       └── authStore.ts            # accessToken + role 관리
│
└── server/
    ├── src/
    │   ├── auth/
    │   │   ├── auth.module.ts
    │   │   ├── auth.service.ts         # refresh, logout, email verify, OAuth
    │   │   ├── auth.controller.ts
    │   │   ├── jwt.guard.ts
    │   │   ├── roles.guard.ts          # 신규 (RBAC)
    │   │   ├── roles.decorator.ts      # 신규
    │   │   └── google.strategy.ts      # 신규 (Passport Google)
    │   ├── users/
    │   ├── courses/                    # 강의 CRUD + 승인
    │   ├── sections/                   # 신규
    │   ├── episodes/                   # 신규
    │   ├── enrollments/
    │   ├── progress/
    │   ├── reviews/                    # 신규
    │   ├── exams/                      # 신규 (모의고사)
    │   ├── qna/                        # 신규
    │   ├── instructor/                 # 신규 (강사 전용 API)
    │   ├── admin/                      # 신규 (관리자 전용 API)
    │   └── common/
    │       ├── decorators/
    │       │   ├── current-user.decorator.ts
    │       │   └── roles.decorator.ts  # 신규
    │       └── guards/
    │           ├── jwt.guard.ts
    │           └── roles.guard.ts      # 신규
```

---

## 개발 일정

### Week 1 (4/10~4/15) — P2 설계 및 인증 강화
- [x] P2 기획/요구사항/ERD/API 문서 작성
- [x] Project1 → Project2 복사 및 아카이브
- [ ] Refresh Token 도입 (서버: auth 모듈 수정)
- [ ] Roles Guard 구현 (RBAC)
- [ ] 이메일 인증 기능 구현

### Week 2 (4/17~4/22) — 역할 분리 및 강사 기능
- [ ] 강사 강의 등록/수정/삭제 API
- [ ] 섹션·에피소드 CRUD API
- [ ] 썸네일 S3 업로드 API
- [ ] 강사 대시보드 API
- [ ] 프론트엔드: 강사 대시보드 페이지 및 강의 등록 폼

### Week 3 (4/24~4/29) — 관리자 기능 및 리뷰
- [ ] 관리자 강의 승인/반려 API
- [ ] 관리자 회원 관리 API
- [ ] 리뷰·평점 CRUD API
- [ ] 프론트엔드: 관리자 대시보드, 리뷰 섹션 (강의 상세)
- [ ] 강의 목록 "수강 중" 배지 표시

### Week 4 (5/1~5/6) — 모의고사 및 Q&A
- [ ] 모의고사 CRUD API (문제 등록, 응시, 채점)
- [ ] Q&A API
- [ ] 프론트엔드: 모의고사 응시 페이지, Q&A 페이지

### Week 5 (5/8~5/13) — 마무리
- [ ] Google OAuth 소셜 로그인
- [ ] 검색 MongoDB Text Index 적용
- [ ] 통합 테스트 및 버그 수정
- [ ] 배포 및 최종 제출

---

## API 통신 규칙 (P2 변경)

- `Authorization: Bearer <accessToken>` 헤더 사용 (P1 유지)
- Axios 응답 인터셉터: 401 응답 시 `/api/v1/auth/refresh` 호출 후 원본 요청 재시도
- Refresh Token은 서버가 자동으로 쿠키에서 읽음 (`withCredentials: true` 필요)

```typescript
// Axios 인터셉터 예시
axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const { data } = await axiosInstance.post('/api/v1/auth/refresh');
      useAuthStore.getState().setAccessToken(data.data.accessToken);
      err.config.headers['Authorization'] = `Bearer ${data.data.accessToken}`;
      return axiosInstance(err.config);
    }
    return Promise.reject(err);
  }
);
```
