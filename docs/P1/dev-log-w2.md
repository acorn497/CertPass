# 개발 일지

## 프로젝트: CertPass (P1 MVP)

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-03-26 |
| 기간 | 2026-03-23 ~ 2026-03-30 |

---

백엔드 API를 기반으로 프론트엔드 전체를 구현했다. Vite + React 19 + Tailwind CSS v4.1 환경을 구성하고, 인증·강의 목록·강의 상세·강의 플레이어·내 강의실·마이페이지까지 MVP의 모든 화면을 백엔드와 연동 완료했다.

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

### Week 5 (3/24~3/25) — 핵심 페이지 전체 구현

**로그인 / 회원가입 페이지**
React Hook Form + Zod로 클라이언트 측 유효성 검사 적용. TanStack Query `useMutation`으로 API 호출 상태(로딩·에러) 관리. 성공 시 Zustand 스토어에 토큰·유저 저장 후 홈으로 리다이렉트.

**강의 목록 페이지** (`/courses`)
- TanStack Query `useQuery`로 `GET /api/v1/courses` 연동
- 카테고리 필터 버튼(전체 + 6개 분야)으로 실시간 필터링. 필터 변경 시 페이지 1로 초기화
- 페이지네이션 UI (이전/다음 + 페이지 번호)
- `CourseCard` 컴포넌트 — 썸네일, 제목, 강사, 카테고리/레벨 배지, 무료 표시

**강의 상세 페이지** (`/courses/:courseId`)
- `GET /api/v1/courses/:courseId`로 섹션·에피소드 포함 상세 정보 조회
- `GET /api/v1/enrollments/me/:courseId`로 수강 여부 확인 후 버튼 상태 분기
- 수강 신청 성공 시 `invalidateQueries`로 상태 즉시 갱신
- 미로그인 상태에서 수강 신청 시 `/login`으로 리다이렉트

**강의 플레이어 페이지** (`/courses/:courseId/episodes/:episodeId`)
- `ProtectedRoute`로 미인증 접근 차단
- YouTube iframe embed(`enablejsapi=1`) + postMessage로 영상 종료 시 에피소드 완료 처리 자동화
- 우측 사이드바에 섹션/에피소드 목록 표시. 완료 에피소드 `✓` 마킹
- 진도율 바 표시. 다음 강의 이동 버튼 제공
- 플레이어 페이지는 Header/Footer 없는 전체화면 레이아웃 적용

**내 강의실 페이지** (`/my-courses`)
- `GET /api/v1/enrollments/me`로 수강 강의 목록 조회
- 강의별 진도 바(완료 강 수 / 전체 강 수, 퍼센트) 표시
- 마지막 시청 에피소드가 있으면 이어보기, 없으면 시작하기 버튼 표시

**마이페이지** (`/mypage`)
- `GET /api/v1/users/me`로 프로필 조회 후 폼에 기본값 주입
- `PATCH /api/v1/users/me`로 이름 수정. 성공 시 Zustand 스토어의 유저 정보도 갱신
- `PATCH /api/v1/users/me/password`로 비밀번호 변경. 새 비밀번호 확인 일치 검증(Zod refine)

---

## 3. 미완료 및 보완 필요 사항

| 항목 | 내용 |
|------|------|
| 홈 페이지 | 추천 강의 노출 등 콘텐츠 미구성 |
| 반응형 UI | 모바일 레이아웃 검수 미완료 |
| API 테스트 | Thunder Client / Postman 컬렉션 미작성 |
| 에러 핸들링 | 전역 Exception Filter 미적용 → BE 에러 응답 형식 불일관 가능성 |
| 배포 | Vercel(FE) / Railway(BE) 배포 미완료 |

---

## 4. 진행 현황 (3/26 기준)

| 주차 | 내용 | 상태 |
|------|------|------|
| Week 1 | 설계 및 문서화 | 완료 |
| Week 2 | 백엔드 기초 | 완료 |
| Week 3 | 백엔드 기능 API | 완료 |
| Week 4 | 프론트엔드 기초 | 완료 |
| Week 5 | 프론트엔드 핵심 기능 | 완료 |
| Week 6 | 마무리 및 제출 | 미시작 |
