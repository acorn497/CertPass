# 개발 일지

## 프로젝트: CertPass (P1 MVP)

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-03-26 |
| 기간 | 2026-03-16 ~ 2026-03-26 |

---

2주간 NestJS 기반 백엔드 서버를 처음부터 구축했다. 프로젝트 초기 세팅부터 인증, 강의, 수강 신청, 학습 진도까지 MVP에 필요한 API를 모두 구현했으며, 개발 편의를 위한 시드 스크립트도 작성했다.

---

## 2. 단계 별 작업 내용

### Week 2 (3/16~3/17) — 프로젝트 세팅 및 인증

**환경 구성**
NestJS + TypeScript + Mongoose 조합으로 프로젝트를 초기 세팅하고, `.env` 파일 기반으로 MongoDB 연결을 구성했다.

**스키마 설계 및 정의**
도메인 모델 6개를 Mongoose 스키마로 정의했다.

| 스키마 | 주요 필드 |
|--------|----------|
| User | 이메일, 비밀번호(해시), 이름, 역할(student/instructor) |
| Course | 제목, 강사, 카테고리, 가격, 공개 여부 |
| Section | 강의 챕터, Course 참조 |
| Episode | 영상 URL, 재생 시간, 무료 공개 여부 |
| Enrollment | User ↔ Course 수강 관계 |
| Progress | 에피소드별 시청 완료 여부, 마지막 재생 위치 |

**인증 API 구현**
- `POST /api/v1/auth/register` — bcrypt 해싱 후 회원 저장
- `POST /api/v1/auth/login` — JWT 발급 (payload: userId, email, role)
- `JwtGuard` — Bearer 토큰 검증, 이후 모든 인증 엔드포인트에서 재사용
- `@CurrentUser()` 데코레이터 — 컨트롤러에서 인증된 유저 정보 주입

---

### Week 3 (3/18~3/20) — 기능 API 전체 구현

**사용자 프로필** (`GET/PATCH /api/v1/users/me`)
인증된 유저 본인의 프로필 조회 및 수정. 비밀번호는 응답에서 제외.

**카테고리** (`GET /api/v1/categories`)
인증 불필요한 공개 엔드포인트. 전체 카테고리 목록 반환.

**강의 목록/상세** (`GET /api/v1/courses`, `GET /api/v1/courses/:id`)
카테고리·키워드 필터링 지원. 상세 조회 시 섹션·에피소드 목록 포함(populate).

**에피소드 영상 조회** (`GET /api/v1/courses/:courseId/episodes/:episodeId`)
무료 에피소드는 누구나 접근 가능. 유료 에피소드는 수강 신청 여부를 서비스 레이어에서 검사 후 접근 제어.

**수강 신청** (`POST /api/v1/enrollments`, `GET /api/v1/enrollments/me`)
중복 신청 방지 처리. 내 수강 목록 조회 시 강의 정보 populate.

**학습 진도** (`POST /api/v1/progress`, `GET /api/v1/progress/:courseId`)
에피소드별 시청 완료 여부와 마지막 재생 위치(초 단위) 저장. 동일 에피소드 재요청 시 upsert 처리. 강의 전체 진도율 계산하여 응답.

**시드 스크립트**
`npm run seed` 명령으로 샘플 강의/섹션/에피소드 데이터 삽입.

---

## 3. 미완료 및 보완 필요 사항 (3/21~3/26)

| 항목 | 내용 |
|------|------|
| API 테스트 | Thunder Client / Postman 컬렉션 미작성 |
| 에러 핸들링 | 전역 Exception Filter 미적용 → 응답 형식 불일관 가능성 |
| 유효성 검사 | 일부 엔드포인트 `ValidationPipe` 누락 가능성 |
| 개발 환경 | Docker Compose 파일 미비, MongoDB 버전 정비 필요 |
| Week 4 준비 | 프론트엔드 Vite 세팅 및 API 타입 정의 미시작 |

---

## 4. 진행 현황 (3/26 기준)

| 주차 | 내용 | 상태 |
|------|------|------|
| Week 1 | 설계 및 문서화 | 완료 |
| Week 2 | 백엔드 기초 | 완료 |
| Week 3 | 백엔드 기능 API | 구현 완료 / 테스트 미완 |
| Week 4 | 프론트엔드 기초 | 미시작 |
| Week 5 | 프론트엔드 핵심 기능 | 미시작 |
| Week 6 | 마무리 및 제출 | 미시작 |
