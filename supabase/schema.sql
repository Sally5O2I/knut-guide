-- 교통대 꿀팁 가이드 — Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여 넣고 실행한다. (여러 번 실행해도 안전)
--
-- 구조
--   submissions      : 재학생 제보 (누구나 넣기만 가능, 읽기·처리는 매니저만)
--   published_items  : 매니저가 승인해 공개된 항목 (누구나 읽기)
--   managers         : 매니저 계정 목록 (auth.users의 id)
--
-- 매니저 추가 방법
--   1) Authentication → Users → Add user 로 이메일·비밀번호 계정을 만든다.
--   2) 아래 SQL에 그 계정 이메일을 넣어 실행한다.
--      insert into public.managers (user_id, note)
--      select id, '매니저 이름' from auth.users where email = 'manager@example.com';

create extension if not exists pgcrypto;

create table if not exists public.managers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('edit', 'new')),
  target_id text check (char_length(target_id) <= 40),
  payload jsonb not null check (pg_column_size(payload) < 8000),
  message text not null default '' check (char_length(message) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  check ((kind = 'edit') = (target_id is not null))
);

create index if not exists submissions_status_idx on public.submissions (status, created_at desc);

create table if not exists public.published_items (
  id text primary key check (char_length(id) <= 40),
  data jsonb not null check (pg_column_size(data) < 16000),
  source_submission uuid references public.submissions(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- 현재 로그인한 사람이 매니저인지
create or replace function public.is_manager()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.managers where user_id = auth.uid());
$$;

-- 승인/반려를 한 번에 처리한다 (제보 상태 변경 + 공개 항목 반영이 같이 성공하거나 같이 실패)
create or replace function public.review_submission(sub_id uuid, approve boolean, item_id text, item jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_manager() then
    raise exception '매니저만 처리할 수 있어요.';
  end if;

  update public.submissions
     set status = case when approve then 'approved' else 'rejected' end,
         reviewed_at = now(),
         reviewed_by = auth.uid()
   where id = sub_id and status = 'pending';
  if not found then
    raise exception '이미 처리된 제보예요.';
  end if;

  if approve then
    if item is null or item_id is null then
      raise exception '승인할 내용이 비어 있어요.';
    end if;
    insert into public.published_items (id, data, source_submission, updated_at)
    values (item_id, item, sub_id, now())
    on conflict (id) do update
      set data = excluded.data, source_submission = excluded.source_submission, updated_at = now();
  end if;
end;
$$;

alter table public.managers enable row level security;
alter table public.submissions enable row level security;
alter table public.published_items enable row level security;

-- managers: 본인 행만 보이고, 추가·삭제는 SQL Editor(관리자)에서만
drop policy if exists managers_self on public.managers;
create policy managers_self on public.managers for select using (user_id = auth.uid());

-- submissions: 누구나 "대기" 상태로 넣기만 가능, 나머지는 매니저만
drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions for insert to anon, authenticated
  with check (status = 'pending' and reviewed_at is null and reviewed_by is null);
drop policy if exists submissions_manager_read on public.submissions;
create policy submissions_manager_read on public.submissions for select using (public.is_manager());
drop policy if exists submissions_manager_update on public.submissions;
create policy submissions_manager_update on public.submissions for update using (public.is_manager());
drop policy if exists submissions_manager_delete on public.submissions;
create policy submissions_manager_delete on public.submissions for delete using (public.is_manager());

-- published_items: 누구나 읽기, 쓰기는 매니저만 (보통은 review_submission 함수로)
drop policy if exists published_read on public.published_items;
create policy published_read on public.published_items for select using (true);
drop policy if exists published_manager_write on public.published_items;
create policy published_manager_write on public.published_items for all using (public.is_manager()) with check (public.is_manager());

-- ───────── 좋아요 (로그인 없이 기기당 1번) ─────────
-- device_id는 브라우저가 처음 방문 때 만든 임의 값이다 (개인정보 아님).
-- 테이블은 직접 읽고 쓰지 못하게 막고, 아래 두 함수로만 쓴다.
--   like_counts() : 항목별 좋아요 수
--   set_like()    : 누르기/취소. 같은 기기·같은 항목은 1번만 저장된다.
create table if not exists public.likes (
  item_id text not null check (char_length(item_id) between 1 and 40),
  device_id uuid not null,
  ip_hash text,
  created_at timestamptz not null default now(),
  primary key (item_id, device_id)
);
create index if not exists likes_ip_time_idx on public.likes (ip_hash, created_at);
create index if not exists likes_device_time_idx on public.likes (device_id, created_at);
alter table public.likes enable row level security;
-- 정책을 하나도 두지 않아 anon/authenticated는 테이블에 직접 접근할 수 없다.

create or replace function public.like_counts()
returns table (item_id text, n bigint)
language sql stable security definer set search_path = public
as $$
  select l.item_id, count(*) from public.likes l group by l.item_id;
$$;

create or replace function public.set_like(p_item text, p_device uuid, p_like boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_ip text := coalesce(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), '');
  -- IP는 그대로 저장하지 않고 해시만 남긴다 (sha256은 Postgres 기본 함수)
  v_hash text := encode(sha256(convert_to(v_ip || ':knut-guide', 'UTF8')), 'hex');
begin
  if p_item is null or char_length(p_item) not between 1 and 40 then
    raise exception 'invalid item';
  end if;
  if not p_like then
    delete from public.likes where item_id = p_item and device_id = p_device;
    return;
  end if;
  -- 남용 방지: 한 기기 1분에 30번, 한 IP 1시간에 400번까지 (학교 와이파이는 여러 명이 같은 IP를 쓴다)
  if (select count(*) from public.likes where device_id = p_device and created_at > now() - interval '1 minute') >= 30
     or (select count(*) from public.likes where ip_hash = v_hash and created_at > now() - interval '1 hour') >= 400 then
    raise exception 'too_many_likes';
  end if;
  insert into public.likes (item_id, device_id, ip_hash) values (p_item, p_device, v_hash)
  on conflict (item_id, device_id) do nothing;
end;
$$;

grant execute on function public.like_counts() to anon, authenticated;
grant execute on function public.set_like(text, uuid, boolean) to anon, authenticated;

grant execute on function public.is_manager() to anon, authenticated;
grant execute on function public.review_submission(uuid, boolean, text, jsonb) to authenticated;
