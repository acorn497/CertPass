---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap');

  * { box-sizing: border-box; }

  section {
    font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    padding: 52px 64px;
    font-size: 22px;
    line-height: 1.7;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  section::after {
    font-size: 14px;
    color: #475569;
  }

  h1 {
    font-size: 38px;
    font-weight: 700;
    color: #f8fafc;
    border-left: 5px solid #6366f1;
    padding-left: 18px;
    margin-bottom: 32px;
    line-height: 1.3;
  }

  h2 {
    font-size: 26px;
    font-weight: 600;
    color: #a5b4fc;
    margin-bottom: 12px;
  }

  strong { color: #818cf8; }
  em { color: #94a3b8; font-style: normal; }

  p { margin: 0 0 14px; }

  ul, ol {
    padding-left: 22px;
    margin: 0 0 14px;
  }

  li {
    margin-bottom: 8px;
    color: #cbd5e1;
  }

  li::marker { color: #6366f1; }

  code {
    background: #1e293b;
    color: #a5b4fc;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.88em;
  }

  pre {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 24px 28px;
    font-size: 17px;
    line-height: 1.8;
  }

  pre code {
    background: none;
    padding: 0;
    color: #e2e8f0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 19px;
    margin-top: 8px;
  }

  th {
    background: #1e293b;
    color: #a5b4fc;
    font-weight: 600;
    padding: 12px 16px;
    border: 1px solid #334155;
    text-align: left;
  }

  td {
    padding: 11px 16px;
    border: 1px solid #1e293b;
    color: #cbd5e1;
    background: #0f172a;
  }

  tr:nth-child(even) td { background: #131f35; }

  blockquote {
    border-left: 3px solid #4f46e5;
    background: #1e293b;
    margin: 0;
    padding: 14px 20px;
    border-radius: 0 8px 8px 0;
    color: #94a3b8;
    font-size: 0.92em;
  }

  section.lead {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    padding: 64px 80px;
  }

  section.lead h1 {
    font-size: 52px;
    border: none;
    padding: 0;
    color: #f8fafc;
    margin-bottom: 8px;
    line-height: 1.2;
  }

  section.lead h2 {
    font-size: 24px;
    color: #6366f1;
    margin-bottom: 32px;
  }

  section.lead p {
    color: #94a3b8;
    font-size: 20px;
    line-height: 1.8;
  }

  section.lead strong {
    color: #a5b4fc;
  }

  .tag {
    display: inline-block;
    background: #312e81;
    color: #a5b4fc;
    font-size: 14px;
    padding: 3px 12px;
    border-radius: 99px;
    margin-right: 6px;
    margin-bottom: 24px;
  }

  section.video-slide {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #0f172a 0%, #1a1040 100%);
  }

  section.video-slide h1 {
    border: none;
    padding: 0;
    text-align: center;
    font-size: 36px;
    margin-bottom: 24px;
  }
---

<!-- _class: lead -->
# CertPass
## 자격증 온라인 강의 플랫폼

<span class="tag">Project 3</span>

결제 · 알림 · 운영 자동화 · 성능 최적화

---

# 1. 프로젝트 소개

CertPass는 **자격증 시험 준비생**을 위한 온라인 강의 플랫폼입니다.

- 강의 탐색 → 결제·수강 신청 → 영상 학습 → 진도·모의고사
- **수강생 · 강사 · 관리자** 3개 역할 기반 운영
- P3에서 **수익화(결제) · 사용자 알림 · 운영 자동화 · 최적화**까지 확장

*대상 자격증: 정보처리기사, 어학, 금융, 부동산 등*

---

# 2. P2 → P3 발전 방향

| 영역 | P2 | P3 |
|------|----|----|
| 수익화 | 무료 강의만 | **토스페이먼츠 유료 결제** |
| 알림 | 없음 | **이메일 · Discord 구독 알림** |
| 운영 | 수동 | **스케줄러 기반 자동화** |
| 연동 | 없음 | **웹훅(Inbound/Outbound)** |
| 안정성 | 기본 | **모니터링 · 메트릭 · 보안 강화** |
| 성능 | 기본 | **인덱스 · 캐싱 · 코드 스플리팅** |

---

# 3. 시스템 아키텍처

```text
client (React 19 SPA)            server (NestJS 11 API)
  ├─ TanStack Query (5분 캐시)     ├─ Auth / Users / Courses
  ├─ lazy() 코드 스플리팅           ├─ Enrollments / Progress / Reviews
  ├─ Zustand 인증 상태             ├─ Exams / Qna / Instructor / Admin
  └─ Toss Payments SDK            ├─ Payments / Subscriptions
                                  ├─ Webhooks / Notifications
   ┌──────────────────────┐       ├─ Scheduler(node-cron) / Monitoring
   │   REST / JWT Cookie   │       └─ Cache · Metrics · Security MW
   └──────────────────────┘                    │
                                          MongoDB (Mongoose)
```

전역 미들웨어: **RequestLogger · NoSQL Injection 방어 · XSS 정제**

---

# 4. 사용자 역할과 접근 제어

| 역할 | 주요 기능 |
|------|-----------|
| 수강생 | 강의 탐색·결제·수강, 영상 학습, 리뷰·Q&A, 모의고사, 구독 |
| 강사 | 커리큘럼 관리, 강의별 통계, 미답변 Q&A 응대 |
| 관리자 | 강의 승인, 콘텐츠 모더레이션, 회원·운영 관리, 메트릭 |

**3단 가드 구조**
- `JwtGuard` — 토큰 필수 검증
- `OptionalJwtGuard` — 비로그인 허용(목록/상세), 로그인 시 부가정보
- `RolesGuard` — DB에서 실시간 role 조회 후 `@Roles()` 검증

---

# 5. 핵심 기능 ① 결제 (Toss Payments)

강의 수익화를 위한 **결제 → 수강 자동 등록** 플로우

```text
1. POST /payments/courses/:id/checkout  결제 준비(주문 생성)
2. Toss 결제창 / Sandbox 모드
3. POST /payments/confirm               승인 검증 + 금액 검증
4. enrollment 자동 생성                  결제 즉시 수강 등록
```

- 공급자 전환: `sandbox` / `toss` (`TOSS_SECRET_KEY` 기반 승인)
- **무료 강의는 즉시 paid 처리**, 유료는 금액 위변조 검증
- `GET /payments/me` — 내 결제 내역 조회

---

# 6. 핵심 기능 ② 구독 · 알림

학습 이탈을 줄이는 **주제 기반 알림 구독**

**구독 채널**
- 이메일(SMTP) · Discord 웹훅
- 주제 구조: `course_updates` · `qna_digest` · `exam_d_day`
- `upsert` 기반 등록 — 중복 없이 구독 갱신

**알림 발송 (NotificationsService)**
- nodemailer 이메일 / Discord 웹훅 POST
- SMTP 미설정 시 로그만 남겨 개발 환경에서도 안전

---

# 7. 핵심 기능 ③ 운영 자동화 (Scheduler)

`node-cron` 기반 **정기 작업 자동 실행**

| 작업 | 기본 주기 | 내용 |
|------|----------|------|
| 일일 다이제스트 | `0 9 * * *` | Q&A 요약 알림 발송 |
| 시험 D-day | `0 8 * * *` | 7일 내 시험 알림 |
| 캐시 정리 | `*/15 * * * *` | 만료 캐시 제거 |

- 주기는 환경변수(`DIGEST_CRON` 등)로 커스터마이징
- `SCHEDULER_ENABLED=false`로 비활성화 가능
- 관리자 수동 실행 엔드포인트 + 운영 페이지(`/ops`) 제공

---

# 8. 핵심 기능 ④ 웹훅 연동

외부 시스템과의 **양방향 이벤트 연동**

- **Inbound** `POST /webhooks/inbound/:provider`
  - `x-webhook-secret` 헤더 검증
  - `webhook_events` 컬렉션에 수신 이력 기록(`received` → `processed` / `failed`)
- **Outbound** `POST /webhooks/outbound/test` (관리자)
  - `X-Webhook-Secret` 서명 후 발송, 결과 기록

> 수신·발송 이력 저장으로 이벤트 추적과 실패 분석 기반 확보

---

# 9. 핵심 기능 ⑤ 강사 · 관리자 운영 강화

**강사 (P3 요구사항 반영)**
- 강의 커리큘럼(섹션·에피소드) 추가/수정 — 본인 강의만(소유권 검증)
- **응답해야 할 질문만 모아보기** — 강사 답변 없는 Q&A 필터
- 대시보드에서 내 강의만 표시(`instructor_id` 필터)

**관리자**
- 강의 승인 시 해당 강의로 **바로 이동**
- 부적절한 **강의 · Q&A · 댓글 · 리뷰** 삭제(연관 데이터 정리)
- 강의·작성자를 **계정명(이메일)** 형식으로 표시

---

# 10. 최적화 ① 데이터베이스 인덱스

조회 패턴에 맞춘 **복합 인덱스 · 전문 검색 · 유니크 제약**

| 컬렉션 | 인덱스 | 목적 |
|--------|--------|------|
| courses | `title·desc·instructor·examName` (text) | 전문 검색 |
| courses | `status·isPublished·createdAt` | 노출 강의 최신순 |
| courses | `instructor_id·createdAt` | 강사별 강의 |
| enrollments | `user_id·course_id` (unique) | 중복 수강 방지 |
| reviews / progress | (unique 복합) | 1인 1리뷰·중복시청 방지 |
| payments | `paymentKey·orderId` (sparse) | 결제 승인 검증 |

---

# 11. 최적화 ② 캐싱 · 집계 쿼리

**인메모리 TTL 캐시 (CacheService)**
- `Map` 기반, 기본 TTL 60초
- `deleteByPrefix()` 프리픽스 무효화 / 15분마다 만료 정리(스케줄러)

**집계 쿼리로 목록성 조회 최적화**
- 리뷰 평점 재계산: `$match → $group(avg, count)` 1쿼리
- 강사 대시보드 수강자 수: 강의별 `$group` 일괄 집계
- 미답변 Q&A 댓글 수: 게시글당 댓글 수 한 번에 집계

> 반복 조회가 컸던 목록성 데이터를 aggregate 기반으로 줄이고, 상세 통계는 필요한 범위만 계산

---

# 12. 최적화 ③ 클라이언트

**TanStack Query 캐싱**
- `staleTime` 5분 — 동일 데이터 재요청 억제
- `retry` 1회 — 불필요한 재시도 제거

**코드 스플리팅**
- 모든 페이지 `lazy()` 동적 임포트 + `Suspense`
- 초기 번들 축소, 라우트 진입 시 청크 로드

**레이아웃 분리**
- 플레이어 / 모의고사 전용 전체화면 레이아웃

---

# 13. 모니터링 · 메트릭

운영 가시성을 위한 **헬스 체크 + 지표 수집**

- `GET /health` — MongoDB 연결 상태(`readyState`)
- `GET /metrics` (관리자) — 실시간 스냅샷
  - **카운터**: 요청 수, 스케줄러 실행 횟수
  - **타이밍**: API 응답시간(count·avg·max)
  - **메모리**: `process.memoryUsage()`
  - **캐시**: 활성 키 수, 만료 임박 키 수
- `RequestLoggerMiddleware` + winston 구조적 로깅

---

# 14. 보안 강화

다층 방어로 **입력 신뢰 경계** 확보

| 영역 | 적용 |
|------|------|
| NoSQL Injection | `$`·`.` 포함 키 재귀 제거 미들웨어(전역) |
| XSS | `sanitize-html` 기반 요청 본문 정제 |
| HTTP 헤더 | helmet (nosniff·DENY·no-referrer) |
| 인증 | JWT + Refresh, bcrypt 해시 |
| 인가 | RolesGuard로 DB 실시간 role 검증 |
| CORS | `CLIENT_URL` origin + credentials |

---

# 15. 데이터 모델

| 컬렉션 | 용도 |
|--------|------|
| users / categories | 인증·권한, 카테고리 |
| courses | 강의 + 내장 sections·episodes, 승인 상태, 평점 |
| enrollments / progresses | 수강 등록, 진도 |
| reviews / qna_posts / qna_comments | 리뷰, Q&A |
| exams / questions / exam_attempts | 모의고사, 문항, 응시 |
| **payments / subscriptions** | 결제, 알림 구독 |
| **webhook_events** | 웹훅 수신·발송 이력 |

---

# 16. 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| Frontend | React 19, TypeScript, Vite, React Router 7, TanStack Query |
| State / Form | Zustand, Axios, React Hook Form, Zod |
| Styling | Tailwind CSS 4 |
| Payments | **@tosspayments/tosspayments-sdk** |
| Backend | NestJS 11, Mongoose 9, Zod |
| 운영 | node-cron, nodemailer, winston, helmet, sanitize-html |
| Database | MongoDB |
| Auth | JWT(Access/Refresh), bcrypt, cookie-parser |

---

<!-- _class: video-slide -->
# 기능 시연

## 시연 순서

1. 강의 결제(Sandbox) → 수강 자동 등록
2. 강사: 커리큘럼 편집 · 미답변 Q&A 확인
3. 관리자: 강의 승인·이동 · 콘텐츠 모더레이션
4. 운영 페이지: 스케줄러 수동 실행 · `/metrics` 확인

---

# 17. 정리 및 성과

**P3 결과**
- 무료 서비스 → **토스페이먼츠 결제 기반 수익형 플랫폼**으로 확장
- **알림·구독·스케줄러·웹훅**으로 운영 자동화 체계 구축
- **인덱스·캐싱·aggregate·코드 스플리팅**으로 성능 최적화
- **모니터링·메트릭·다층 보안**으로 운영 안정성 확보

**향후 계획**
- 운영 계정 전환 · 환불/취소 · 영수증/정산 관리
- 알림 주제 선택 UI · 채널 확대
- 분산 캐시(Redis) · 메트릭 외부 수집(Prometheus) 연계

---

# 18. 참조

**GitHub** — https://github.com/acorn497/CertPass

| 문서 | 경로 |
|------|------|
| 요구사항 | docs/P3/requirements.md |
| P2 기획서 | docs/P2/planning.md |
| P2 API 명세 | docs/P2/api.md |
| ERD | docs/P2/erd.md |
