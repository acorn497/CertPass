# Bug Report #001 — CodeBlock 구문 강조 HTML 재파싱 오류

| 항목 | 내용 |
|------|------|
| **날짜** | 2026-03-09 |
| **심각도** | Medium — 기능 오류 (UI 깨짐) |
| **상태** | ✅ 수정 완료 |
| **파일** | `client/src/components/CodeBlock/CodeBlock.tsx` |

---

## 증상

단어 상세 페이지(`/words/:id`)의 코드 예시 블록에서 특정 단어의 코드가 깨져 출력됨.

**재현 단어**: `class` (카테고리: 객체지향)

**코드 예시 원문 (Python)**:
```python
class Student:
  def __init__(self, name):
    self.name = name
```

**잘못된 출력 (브라우저 화면)**:
```
<span class=<span "kw">class</span> Student:
  ...
```
→ 사용자에게 `"kw">` 문자열이 그대로 노출됨.

---

## 원인 분석

`highlightCode()` 함수가 여러 `.replace()` 호출을 **체인**으로 연결하는 방식을 사용.

```
HTML 이스케이프 → 주석 교체 → 키워드 교체 → 문자열 교체 → 숫자 교체 → 함수 교체
```

**문제 발생 과정**:

1. HTML 이스케이프 후 코드:
   `class Student:\n  def __init__(self, name):\n    self.name = name`

2. 키워드 패턴 교체 후:
   `<span class="kw">class</span> Student:...`

3. 다음 단계인 문자열 패턴 `"[^"]*"` 가 위 결과물을 대상으로 실행됨
   → `<span class="kw">` 안의 **`"kw"`** 를 문자열로 인식하여 교체:
   `<span class=<span class="str">"kw"</span>>class</span>`

4. 브라우저가 깨진 HTML을 파싱
   → `<span class=` 가 불완전한 태그로 남아 `"kw">` 가 텍스트로 렌더링됨.

**핵심 원인**: 다중 `.replace()` 체인에서 앞 단계가 주입한 HTML 속성값(`class="kw"`)이 뒤 단계의 정규식에 재매칭됨.

---

## 수정 내용

**단일 패스 정규식**으로 모든 패턴을 동시에 처리하도록 변경.

```typescript
// 수정 전 (다중 체인 — 재매칭 발생)
return escaped
  .replace(/(#[^\n]*)/g, '<span class="cm">$1</span>')
  .replace(/\b(def|class|...)\b/g, '<span class="kw">$1</span>')
  .replace(/("""...|'[^']*')/g, '<span class="str">$1</span>') // "kw" 재매칭!
  ...

// 수정 후 (단일 패스 — 재매칭 없음)
return escaped.replace(
  /(#[^\n]*)|("""[\s\S]*?"""|'[^']*')|(\b\d+\.?\d*\b)|(\b[a-zA-Z_]\w*\b)(?=\s*\()|\b(def|class|...)\b/g,
  (match, cm, str, num, fn, kw) => {
    if (cm  !== undefined) return `<span class="cm">${cm}</span>`;
    if (str !== undefined) return `<span class="str">${str}</span>`;
    if (num !== undefined) return `<span class="num">${num}</span>`;
    if (fn  !== undefined) return `<span class="fn">${fn}</span>`;
    if (kw  !== undefined) return `<span class="kw">${kw}</span>`;
    return match;
  }
);
```

**왜 단일 패스가 안전한가**:
- 정규식 엔진은 소스 문자열을 좌→우로 한 번만 순회
- 한 위치에서 매칭된 문자는 다음 패턴의 대상이 되지 않음
- 따라서 앞 단계가 주입한 `<span class="kw">` 내부의 `"kw"` 가 문자열 패턴에 재매칭될 수 없음

**적용 언어**: Python, JavaScript/TypeScript, Java, Bash (4개 언어 모두 동일 방식 적용)

---

## 검증

`npm run build` 성공 (타입 오류 없음).

재현 단어(`class`) 코드 예시 정상 출력 확인:
```
Python
──────────────────────────────
class Student:
  def __init__(self, name):
    self.name = name
```
- `class`, `def` → 보라색 키워드 강조
- `__init__`, `name` 인수 → 청록색 함수/변수 강조
- 따옴표 내 문자열 → 분홍색 강조
- `"kw">` 노출 없음

---

## 관련 파일

- `client/src/components/CodeBlock/CodeBlock.tsx` — `highlightCode()` 함수 수정
