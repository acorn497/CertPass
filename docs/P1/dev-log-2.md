# 개발 일지

## 프로젝트: CertPass (P1 MVP)

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-03-26 |
| 기간 | 2026-03-23 ~ 2026-03-24 |

---

2주차·3주차에 완성한 백엔드 API를 기반으로 프론트엔드 기초 세팅과 핵심 페이지를 구현했다. Vite + React 19 + Tailwind CSS v4.1 환경을 구성하고, 인증·강의 목록·강의 상세까지 백엔드 연동을 완료했다.

---

## 2. 단계 별 작업 내용

### Week 4 (3/23) — 프론트엔드 기초 세팅

**프로젝트 초기화**
Vite + React 19 + TypeScript 기반으로 `client/` 디렉토리에 프로젝트를 생성하고, Tailwind CSS v4.1을 `@tailwindcss/vite` 플러그인으로 연동했다.

**패키지 구성**

| 패키지 | 용도 |
|--------|------|
| React Router v6 | 클라이언트 라우팅 |
| TanStack Query v5 | 서버 상태 관리 |
| Zustand | 클라이언트 인증 상태 |
| Axios | HTTP 클라이언트 |
| React Hook Form + Zod | 폼 관리 및 유효성 검사 |

**Axios 인터셉터 및 인증 스토어**
- `api/client.ts` — 요청 인터셉터에서 JWT Bearer 토큰 자동 주입. 응답 인터셉터에서 401 수신 시 Zustand 스토어의 `logout()` 자동 호출
- `stores/authStore.ts` — Zustand로 `token`/`user` 상태 관리. `localStorage`에 영속화하여 새로고침 후에도 로그인 상태 유지

**레이아웃 구성**
Header(네비게이션, 로그인 상태에 따라 버튼 분기), Footer, Layout 래퍼 컴포넌트 구현. React Router `<Outlet>`으로 페이지 교체 구조 완성.

---

### Week 5 (3/24) — 인증 페이지 및 강의 목록/상세 페이지

**로그인 / 회원가입 페이지**
React Hook Form + Zod로 클라이언트 측 유효성 검사 적용. TanStack Query `useMutation`으로 API 호출 상태(로딩·에러) 관리. 성공 시 Zustand 스토어에 토큰·유저 저장 후 홈으로 리다이렉트.

**강의 목록 페이지** (`/courses`)
- TanStack Query `useQuery`로 `GET /api/v1/courses` 연동
- 카테고리 필터 버튼(전체 + 6개 분야)으로 실시간 필터링. 필터 변경 시 페이지 1로 초기화
- 페이지네이션 UI (이전/다음 + 페이지 번호)
- `CourseCard` 컴포넌트 — 썸네일, 제목, 강사, 카테고리/레벨 배지, 무료 표시

**강의 상세 페이지** (`/courses/:courseId`)
- `GET /api/v1/courses/:courseId`로 섹션·에피소드 포함 상세 정보 조회
- `GET /api/v1/enrollments/me/:courseId`로 수강 여부 확인 후 버튼 상태 분기(무료 수강 신청 / 수강 중)
- `POST /api/v1/enrollments` 수강 신청 성공 시 `invalidateQueries`로 수강 상태 즉시 반영
- 섹션별 에피소드 목록과 재생 시간(mm:ss) 표시
- 미로그인 상태에서 수강 신청 시 `/login`으로 리다이렉트

---

## 3. 미완료 및 보완 필요 사항

| 항목 | 내용 |
|------|------|
| 강의 플레이어 | YouTube iframe 임베드, 에피소드 사이드바, 진도 API 연동 미구현 |
| 내 강의실 | 수강 강의 목록 및 진도율 표시 페이지 미구현 |
| 마이페이지 | 프로필 수정, 비밀번호 변경 폼 미구현 |
| 반응형 UI | 모바일 레이아웃 검수 미완료 |
| Protected Route | 인증 필요 페이지 접근 제어 미적용 |

---

## 4. 진행 현황 (3/26 기준)

| 주차 | 내용 | 상태 |
|------|------|------|
| Week 1 | 설계 및 문서화 | 완료 |
| Week 2 | 백엔드 기초 | 완료 |
| Week 3 | 백엔드 기능 API | 완료 |
| Week 4 | 프론트엔드 기초 | 완료 |
| Week 5 | 프론트엔드 핵심 기능 | 인증·강의 목록·상세 완료 / 플레이어·내 강의실 미완 |
| Week 6 | 마무리 및 제출 | 미시작 |
