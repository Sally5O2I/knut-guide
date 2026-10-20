# 교통대 꿀팁 가이드

한국교통대학교 충주캠퍼스 재학생 21명이 추천한 맛집·숨은장소·생활꿀팁·자유 정보(392개)를 모은 모바일 우선 웹사이트.

## 기능

| 기능 | 위치 |
| --- | --- |
| 검색 (띄어쓰기 무시, 초성 `ㅂㄹㄸ`, 여러 단어) | 머리글 검색창, `찾기` 탭 |
| 분류별 목록 (맛집 / 숨은장소 / 생활꿀팁 / 자유) + 정렬·위치·혼밥 필터 | `/list/:sheet` |
| 캠퍼스 약도 → 대학로 거리 약도를 한 페이지에서 스크롤로 | `지도` |
| 999번·700번 시간표, 지금 시각 기준 다음 차 | `버스` |
| 둘레길 8개 구간 약도 | `둘레길` |
| 정보 업데이트: 장소 상세 창 오른쪽 위 **정보추가** → 수정 요청 → 매니저 승인 → 반영 | 상세 창 |
| 신규 등록: **정보 신규 등록** → 제출 → 매니저 승인 → 등록 | `등록` 탭 |
| ❤️ 좋아요: 로그인 없이 기기당 1번, 다시 누르면 취소. "좋아요 많은 순" 정렬, 홈 "요즘 인기" | 카드·상세 창 |
| 매니저 승인 화면 | 맨 아래 `매니저 로그인` (`#/manager`) |
| 오늘의 충주 날씨 (누르면 네이버 날씨) | 머리글 오른쪽 |

## 실행

```bash
npm install
npm run dev
```

## 데이터 고치기

정규화 엑셀(`data/정규화.xlsx`)을 고친 뒤:

```bash
npm run import-data
```

`src/data/guide.json`이 다시 만들어진다. 열은 머리글 이름(이름·위치·지도·확인한 날·추천 수·유형·혼밥·가격(원)·가격 기준·비고)으로 찾으므로 열 순서가 바뀌어도 된다.

- `확인 안 됨` / `해당 없음`은 화면에서 숨긴다.
- 1_맛집·2_숨은장소의 비고는 정리 메모라 싣지 않는다. 3_생활꿀팁·4_자유의 비고(학생들이 적은 내용)는 싣는다.
- 순위 번호만 있는 메모(`캠퍼스 2번`), 빈 양식 칸(`추천 이유:`), `※ 정리 메모`는 걷어 낸다.
- 항목 id는 시트+이름으로 만든다. **이름을 엑셀에서 바꾸면 그 항목에 승인된 수정이 끊긴다** (새 항목으로 취급).

버스 시간표는 `src/data/bus.ts`, 캠퍼스 약도 좌표는 `src/data/campusMap.ts`.

## 제보·승인 저장소

| 모드 | 조건 | 동작 |
| --- | --- | --- |
| local | `.env.local` 없음 | 제보·승인이 그 브라우저에만 저장 (시연용, 매니저 비밀번호 없음) |
| supabase | `.env.local`에 값 있음 | 모든 학생에게 반영, 매니저 계정만 승인 |

### Supabase 연결

1. supabase.com에서 프로젝트를 만든다.
2. SQL Editor에 `supabase/schema.sql`을 붙여 넣고 실행한다.
3. Authentication → Users → Add user로 매니저 계정(이메일·비밀번호)을 만든다.
4. SQL Editor에서 매니저로 등록한다:
   ```sql
   insert into public.managers (user_id, note)
   select id, '매니저 이름' from auth.users where email = 'manager@example.com';
   ```
5. Authentication → Sign In / Providers → Email에서 **Allow new users to sign up을 끈다** (매니저 계정은 대시보드에서만 만들기).
6. `.env.example`을 `.env.local`로 복사하고 URL과 anon(publishable) 키를 넣는다. service_role 키는 절대 넣지 않는다.

좋아요: 브라우저가 처음 방문 때 만든 임의의 기기 id로 항목당 1번 저장된다(`likes` 테이블). 테이블은 직접 읽고 쓸 수 없고 `like_counts()`·`set_like()` 함수로만 접근한다. 남용 방지로 기기당 1분 30번, IP당 1시간 400번까지(IP는 해시로만 저장). 브라우저 기록을 지우면 다시 누를 수 있으므로 숫자는 참고용이며, 엑셀의 "재학생 추천 수"와 따로 보여 준다. 이미 schema.sql을 실행했다면 다시 실행하면 좋아요 부분만 추가된다.

보안 규칙: 학생은 로그인 없이 제보를 **넣기만** 할 수 있고 읽을 수 없다. 제보 읽기·승인은 `managers`에 있는 계정만 가능하며, 승인은 `review_submission` 함수 하나로 "상태 변경 + 공개 반영"을 함께 처리한다.

## 배포 (GitHub Pages)

1. GitHub에 `knut-guide` 저장소를 만들고 push (저장소 이름이 다르면 `vite.config.ts`의 `base`를 바꾼다).
2. Settings → Pages → Source: **GitHub Actions**.
3. Supabase를 쓰면 Settings → Secrets and variables → Actions에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 등록.
4. `main`에 push하면 테스트 → 빌드 → 배포.

## 테스트

```bash
npm test
```

엑셀 392행·추천 수 합계 489(검증 시트와 일치), 정리 규칙, 위치 판단, 검색, 제보 승인, 버스 다음 차 계산을 확인한다.
