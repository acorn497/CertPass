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

<span class="tag">Project 2</span>

역할 분리 · 강의 운영 · 학습 보조 기능 확장

---

# 1. 프로젝트 주제

CertPass는 **자격증 시험 준비생**을 위한 온라인 강의 플랫폼입니다.

- 강의 탐색 및 수강 신청
- 영상 플레이어로 학습 + 진도율 확인
- P2에서 **수강생 · 강사 · 관리자** 역할 분리 적용

*대상 자격증: 정보처리기사, 어학, 금융, 부동산 등*

---

# 2. P2 개발 목표

| 항목 | 목표 |
|------|------|
| 역할 확장 | 수강생 중심 → 수강생·강사·관리자 구조로 전환 |
| 인증 개선 | Access Token 단독 → Refresh Token 기반 인증 |
| 학습 경험 | 리뷰 · Q&A · 모의고사로 학습 피드백 기능 추가 |
| 운영 기반 | 강사/관리자 페이지 + 통계 API |

---

# 3. 사용자 역할

| 역할 | 주요 기능 |
|------|-----------|
| 수강생 | 강의 탐색, 수강 신청, 영상 학습, 리뷰, Q&A, 모의고사 응시 |
| 강사 | 내 강의 목록, 강의별 통계, 모의고사·문항 관리 |
| 관리자 | 전체 통계 확인, 운영 관리, 권한 기반 접근 |

클라이언트는 `ProtectedRoute`, 서버는 `JwtGuard` + `RolesGuard`로 접근을 제한합니다.

---

# 4. 특화 기능: 학습 상호작용

단순 시청 이후의 학습 행동 추가

**리뷰 / 평점**
- 강의별 1~5점 평점 및 텍스트 리뷰
- 강의 상세에서 리뷰 목록 + 평균 평점 확인

**Q&A**
- 강의별 질문 등록 · 댓글로 답변

**모의고사**
- 객관식 문항 응시
- 제출 후 점수 · 정답 수 · 응시 기록 저장

---

# 5. 특화 기능: 강사 / 관리자 운영 화면

**강사 페이지** `/instructor`
- 내 강의 목록
- 강의별 수강자 수 · 평균 평점 · 진도 통계

**관리자 페이지** `/admin`
- 전체 회원 수
- 전체 강의 수
- 전체 수강 신청 수
- 운영 지표 확인

---

# 6. 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| Frontend | React 19, TypeScript, Vite, React Router, TanStack Query |
| State / API | Zustand, Axios, React Hook Form, Zod |
| Styling | Tailwind CSS |
| Backend | NestJS 11, TypeScript, Mongoose |
| Database | MongoDB |
| Auth | JWT, Refresh Token, bcrypt, cookie-parser |

---

# 7. 시스템 구조

```text
Project2
  client  (React SPA)
    ├─ Axios API Client
    ├─ ProtectedRoute
    └─ TanStack Query

  server  (NestJS API)
    ├─ Auth / Users / Courses
    ├─ Reviews / Qna / Exams
    ├─ Instructor / Admin
    └─ MongoDB
```

---

# 8. 데이터 모델

| 컬렉션 | 용도 |
|--------|------|
| users | role, refreshToken 등 인증·권한 정보 |
| courses | 강의 정보, 강사, 승인 상태, 평균 평점 |
| reviews | 강의별 평점과 리뷰 |
| qna_posts / qna_comments | 질문과 댓글 |
| exams / questions / exam_attempts | 모의고사, 문항, 응시 기록 |

---

<!-- _class: video-slide -->
# 기능 시연

## 시연 순서

1. 수강생 로그인 → 강의 목록 · 상세 확인
2. 리뷰 · Q&A 작성
3. 강사 페이지 · 관리자 페이지 확인

---

# 9. 정리 및 향후 계획

**P2 결과**
- 단일 수강생 서비스 → **역할 기반 플랫폼**으로 확장
- Refresh Token + Guard 구조로 인증·권한 안정성 개선
- 리뷰 · Q&A로 학습 경험 강화
- 강사/관리자 페이지로 운영 관리 기반 마련

**P3 계획**
- 모의고사, 결제, 알림, 운영 모니터링, 배포 안정화, 성능 최적화

---

# 10. 참조

**GitHub** — https://github.com/acorn497/CertPass

| 문서 | 경로 |
|------|------|
| 기획서 | docs/P2/planning.md |
| 요구사항 | docs/P2/requirements.md |
| API 명세 | docs/P2/api.md |
| ERD | docs/P2/erd.md |
