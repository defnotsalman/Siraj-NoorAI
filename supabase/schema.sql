-- quran_progress table
create table public.quran_progress (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    surah_number integer not null,
    ayah_number integer not null,
    best_score integer default 0,
    attempts integer default 0,
    last_practiced_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    unique(user_id, surah_number, ayah_number)
);

-- RLS Policies
alter table public.quran_progress enable row level security;

create policy "Users can view their own quran progress"
    on public.quran_progress for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own quran progress"
    on public.quran_progress for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own quran progress"
    on public.quran_progress for update
    using ( auth.uid() = user_id );

-- ADMIN AUTHORIZATION MIGRATION
alter table public.users add column if not exists is_admin boolean not null default false;

-- Security definer function to avoid infinite recursion in RLS
create or replace function is_admin(uid uuid) returns boolean
language sql security definer stable as $$
  select coalesce((select is_admin from users where id = uid), false);
$$;

-- Grant admins access to users
create policy "Admins can view all users"
    on public.users for select
    using ( is_admin(auth.uid()) );

create policy "Admins can update all users"
    on public.users for update
    using ( is_admin(auth.uid()) );

-- Grant admins access to reading_progress
create policy "Admins can view all reading progress"
    on public.reading_progress for select
    using ( is_admin(auth.uid()) );

create policy "Admins can view all user stats"
    on public.user_stats for select
    using ( is_admin(auth.uid()) );
