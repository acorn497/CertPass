# 개발 일지

## 프로젝트: CertPass (P2)

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-04-15 |
| 기간 | 2026-04-10 ~ 2026-04-15 |

---

## 1. 주요 목표

P1 MVP 완성을 토대로 P2 단계를 시작했다. 이번 주는 P2 전체 설계와 초기 인프라 구축에 집중했다.
역할 기반 접근 제어(RBAC), Refresh Token 기반 인증 강화, 프로젝트 구조 이관이 주요 작업이었다.

---

## 2. 단계별 작업 내용

### 4/10 (목) — P2 설계 및 문서 작성

**P2 기획/명세 문서 작성**
- `docs/P2/planning.md`: 역할 분리(student·instructor·admin), 주요 신규 기능 범위 정의
- `docs/P2/requirements.md`: 기능 요구사항(FR-A~FR-E 체계) 및 비기능 요구사항 작성
- `docs/P2/erd.md`: P1 스키마에서 P2로의 변경 사항 정의
  - `users` 컬렉션: `refreshToken`, `isEmailVerified` 필드 추가
  - `courses` 컬렉션: `instructor_id`(User 참조), `status`(승인 상태), `avgRating` 필드 추가
  - 신규 컬렉션: `reviews`, `exams`, `questions`, `exam_attempts`, `qna_posts`, `qna_comments`
- `docs/P2/api.md`: P2 신규 API 엔드포인트 명세 (refresh, logout, 강의 CRUD, 리뷰, 모의고사, Q&A 등)
- `docs/P2/dev-plan.md`: 개발 일정, 디렉토리 구조, 클라이언트 인터셉터 패턴 정리

---

### 4/11 (금) — 프로젝트 이관 및 기반 구조 정비

**Project1 → Project2 이관**
- `Project1` 전체 (server + client)를 `Project2`로 복사
- `Project1`을 Archived 상태로 전환, 이후 모든 신규 작업은 `Project2`에서 진행

**인증 버그 검토**

P1 인증 코드를 전체적으로 리뷰한 결과 아래 문제점을 발견했다.

| 이슈 | 위치 | 원인 |
|------|------|------|
| localStorage 파싱 오류 시 앱 크래시 | `authStore.ts` | `JSON.parse` 실패 시 예외 처리 없음 |
| 로그인/회원가입 요청에서 401 수신 시 로그아웃 | `client.ts` | 인터셉터가 인증 엔드포인트 여부를 구분하지 않음 |
| `MyCoursesPage` 타입 불일치 | `MyCoursesPage.tsx` | `queryFn`이 AxiosResponse 그대로 반환, `data.data.data` 3단계 접근 |

각각 수정 내용:
- `authStore.ts`: `try/catch`로 localStorage 파싱 보호, 파싱 실패 시 항목 제거 후 `null` 반환
- `client.ts`: `isAuthEndpoint` 플래그로 `/auth/login`, `/auth/register` 요청에서 자동 로그아웃 방지
- `MyCoursesPage.tsx`: `queryFn`에서 `.then((r) => r.data.data)` 변환하도록 수정, 타입 일관성 확보

---

### 4/12 (토) — Refresh Token 서버 구현

**서버 인증 모듈 확장**

P1에서는 Access Token만 발급했다. P2에서는 Access Token(15분) + Refresh Token(7일) 듀얼 토큰 구조로 전환했다.

- `user.schema.ts`: `refreshToken` 필드 추가 (bcrypt 해시 저장)
- `auth.service.ts` 변경 사항:
  - `register`, `login`: Access Token + Refresh Token 동시 발급, Refresh Token은 해시 후 DB 저장
  - `refresh(token)` 신규: 쿠키에서 Refresh Token 수신 → 검증 → 새 토큰 쌍 발급 (Token Rotation)
  - `logout(userId)` 신규: DB에서 `refreshToken`을 `null`로 초기화
  - `generateAccessToken` / `generateRefreshToken` 분리 (각각 다른 Secret 사용)
- `auth.controller.ts` 변경 사항:
  - `POST /auth/register`, `POST /auth/login`: Refresh Token을 HttpOnly 쿠키(`refreshToken`)로 설정, 응답 바디에는 Access Token만 포함
  - `POST /auth/refresh` 신규: 쿠키에서 Refresh Token 읽어 토큰 재발급
  - `POST /auth/logout` 신규: JwtGuard 적용, 서버 DB 토큰 무효화 + 쿠키 삭제
- `main.ts`: `cookie-parser` 미들웨어 적용
- `.env`: `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN=15m` 추가

**보안 설계 포인트**
- Token Rotation: Refresh Token 사용 시마다 새 Refresh Token 발급 (재사용 방지)
- HttpOnly 쿠키: JavaScript에서 Refresh Token 접근 불가, XSS 공격 방어
- `path=/api/v1/auth`: Refresh Token 쿠키를 인증 경로에서만 전송

---

### 4/14 (월) — Refresh Token 클라이언트 구현

**Axios 인터셉터 — 토큰 자동 재발급**

Access Token 만료(401) 시 사용자 개입 없이 자동 재발급하는 로직을 구현했다.

```
401 응답 감지
  → /auth/refresh 호출 (쿠키의 Refresh Token 자동 전송)
  → 새 Access Token 수신
  → authStore.setToken()으로 갱신
  → 실패한 원본 요청 재시도
  → 여러 요청이 동시에 401이면 Queue에 적재 후 한 번만 재발급
```

- `client.ts`: `isRefreshing` 플래그 + `refreshQueue` 배열로 동시 재발급 요청 중복 방지
- `client.ts`: `withCredentials: true` 추가로 쿠키 자동 전송 활성화
- `authStore.ts`: `setToken(token)` 메서드 추가 (user 정보는 유지하고 token만 갱신)

**로그아웃 흐름 개선**
- `auth.ts`: `authApi.logout()` 추가
- `Header.tsx`: 로그아웃 버튼 클릭 시 서버 API 호출 후 클라이언트 상태 정리 (서버 오류 시에도 클라이언트 로그아웃 보장)

---

### 4/15 (화) — 정리 및 커밋

- 변경 파일 전체 검토 및 코드 일관성 확인
- 개발 일지 작성
- 4/10~4/15 기간 커밋 기록 정리

---

## 3. 이슈 및 대응

| 이슈 | 원인 | 대응 |
|------|------|------|
| Refresh Token 재발급 중 동시 요청 중복 처리 | 여러 API가 동시에 401을 받으면 refresh를 여러 번 호출 | `isRefreshing` 플래그 + Promise Queue 패턴으로 한 번만 재발급 |
| 쿠키 경로 설정 누락 | `path` 없이 쿠키 설정 시 전체 경로에서 전송 | `path=/api/v1/auth`로 범위 제한 |
| P1 `JWT_EXPIRES_IN=1h` → P2 `15m` 변경 | Access Token 수명 단축으로 기존 토큰 즉시 만료 | 개발 환경에서 재로그인으로 해소, 명세에 명시 |

---

## 4. 진행 현황 (4/15 기준)

| 항목 | 상태 |
|------|------|
| P2 전체 설계 문서 작성 | 완료 |
| Project2 기반 구조 이관 | 완료 |
| P1 인증 버그 수정 | 완료 |
| Refresh Token 서버 구현 | 완료 |
| Refresh Token 클라이언트 인터셉터 | 완료 |
| 역할 기반 접근 제어(RolesGuard) | 다음 주 예정 |
| 강사 기능 (강의 등록/수정) | 다음 주 예정 |
| 관리자 기능 | 2주 후 예정 |
