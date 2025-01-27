-- Drop existing tables and functions
DROP FUNCTION IF EXISTS public.cancel_allocation CASCADE;
DROP FUNCTION IF EXISTS public.update_allocation CASCADE;
DROP FUNCTION IF EXISTS public.create_allocation CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at CASCADE;
DROP TABLE IF EXISTS public.allocation_history CASCADE;
DROP TABLE IF EXISTS public.allocations CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.workspaces CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
alter table auth.users enable row level security;

-- Create employees table
create table public.employees (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  gender text not null check (gender in ('male', 'female', 'other')),
  religious_level text not null check (religious_level in ('secular', 'traditional', 'religious', 'orthodox')),
  health_constraints text[] default '{}' not null,
  work_days integer[] not null,
  work_hours jsonb not null default '{"start": "09:00", "end": "17:00"}'::jsonb
);

-- Create workspaces table
create table public.workspaces (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  room text not null,
  floor integer not null,
  features text[] default '{}' not null,
  restrictions text[] default '{}' not null,
  coordinates jsonb not null default '{"x": 0, "y": 0}'::jsonb
);

-- Create allocations table
create table public.allocations (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  employee_id uuid not null references public.employees(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone,
  status text not null check (status in ('active', 'pending', 'completed', 'cancelled')) default 'pending'
);

-- Create allocation_history table
create table public.allocation_history (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  allocation_id uuid not null references public.allocations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  action text not null check (action in ('created', 'updated', 'cancelled')),
  reason text,
  changed_by uuid not null references auth.users(id)
);

-- Enable RLS on all tables
alter table public.employees enable row level security;
alter table public.workspaces enable row level security;
alter table public.allocations enable row level security;
alter table public.allocation_history enable row level security;

-- Create policies for employees table
create policy "Enable read access for authenticated users" on public.employees
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.employees
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.employees
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.employees
  for delete using (auth.role() = 'authenticated');

-- Create policies for workspaces table
create policy "Enable read access for authenticated users" on public.workspaces
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.workspaces
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.workspaces
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.workspaces
  for delete using (auth.role() = 'authenticated');

-- Create policies for allocations table
create policy "Enable read access for authenticated users" on public.allocations
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.allocations
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.allocations
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.allocations
  for delete using (auth.role() = 'authenticated');

-- Create policies for allocation_history table
create policy "Enable read access for authenticated users" on public.allocation_history
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users" on public.allocation_history
  for insert with check (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers for updated_at
create trigger handle_updated_at
  before update on public.employees
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.workspaces
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.allocations
  for each row
  execute procedure public.handle_updated_at();

-- Function to create a new allocation with history
CREATE OR REPLACE FUNCTION create_allocation(
    allocation_data jsonb,
    history_reason text,
    user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_allocation_id uuid;
    new_allocation jsonb;
BEGIN
    -- Insert new allocation
    INSERT INTO allocations (
        employee_id,
        workspace_id,
        start_date,
        end_date,
        status
    )
    SELECT
        (allocation_data->>'employee_id')::uuid,
        (allocation_data->>'workspace_id')::uuid,
        (allocation_data->>'start_date')::timestamp with time zone,
        (allocation_data->>'end_date')::timestamp with time zone,
        COALESCE(allocation_data->>'status', 'active')
    RETURNING id INTO new_allocation_id;

    -- Get the created allocation
    SELECT row_to_json(a.*)::jsonb INTO new_allocation
    FROM allocations a
    WHERE a.id = new_allocation_id;

    -- Create history record
    INSERT INTO allocation_history (
        allocation_id,
        employee_id,
        workspace_id,
        action,
        reason,
        changed_by
    )
    VALUES (
        new_allocation_id,
        (allocation_data->>'employee_id')::uuid,
        (allocation_data->>'workspace_id')::uuid,
        'created',
        history_reason,
        user_id
    );

    RETURN new_allocation;
END;
$$;

-- Function to update an allocation with history
CREATE OR REPLACE FUNCTION update_allocation(
    allocation_id uuid,
    allocation_data jsonb,
    history_reason text,
    user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_allocation jsonb;
BEGIN
    -- Update allocation
    UPDATE allocations
    SET
        employee_id = COALESCE((allocation_data->>'employee_id')::uuid, employee_id),
        workspace_id = COALESCE((allocation_data->>'workspace_id')::uuid, workspace_id),
        start_date = COALESCE((allocation_data->>'start_date')::timestamp with time zone, start_date),
        end_date = COALESCE((allocation_data->>'end_date')::timestamp with time zone, end_date),
        status = COALESCE(allocation_data->>'status', status)
    WHERE id = allocation_id
    RETURNING row_to_json(allocations.*)::jsonb INTO updated_allocation;

    -- Create history record
    INSERT INTO allocation_history (
        allocation_id,
        employee_id,
        workspace_id,
        action,
        reason,
        changed_by
    )
    VALUES (
        allocation_id,
        COALESCE((allocation_data->>'employee_id')::uuid, (updated_allocation->>'employee_id')::uuid),
        COALESCE((allocation_data->>'workspace_id')::uuid, (updated_allocation->>'workspace_id')::uuid),
        'updated',
        history_reason,
        user_id
    );

    RETURN updated_allocation;
END;
$$;

-- Function to cancel an allocation with history
CREATE OR REPLACE FUNCTION cancel_allocation(
    allocation_id uuid,
    history_reason text,
    user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cancelled_allocation allocations;
BEGIN
    -- Update allocation status to cancelled
    UPDATE allocations
    SET 
        status = 'cancelled',
        end_date = timezone('utc'::text, now())
    WHERE id = allocation_id
    RETURNING * INTO cancelled_allocation;

    -- Create history record
    INSERT INTO allocation_history (
        allocation_id,
        employee_id,
        workspace_id,
        action,
        reason,
        changed_by
    )
    VALUES (
        allocation_id,
        cancelled_allocation.employee_id,
        cancelled_allocation.workspace_id,
        'cancelled',
        history_reason,
        user_id
    );
END;
$$;
