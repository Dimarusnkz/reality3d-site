-- 1. Create Portfolio Table
create table public.portfolio (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.portfolio enable row level security;

-- 3. Create Policy: Allow Public Read Access
create policy "Public can view portfolio"
on public.portfolio for select
to anon
using (true);

-- 4. Create Policy: Allow Authenticated Users (Admins) to Insert/Update/Delete
-- Note: For simple demo, we allow 'anon' to edit if you don't have Auth set up yet.
-- Ideally, you should restrict this to authenticated users only.
-- For now, allowing all for demo purposes (change 'anon' to 'authenticated' later):
create policy "Public can manage portfolio"
on public.portfolio for all
to anon
using (true)
with check (true);


-- 5. Create Storage Bucket for Images
insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true);

-- 6. Storage Policy: Public Read
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'portfolio-images' );

-- 7. Storage Policy: Public Upload (For Demo)
create policy "Public Upload"
on storage.objects for insert
to public
with check ( bucket_id = 'portfolio-images' );
