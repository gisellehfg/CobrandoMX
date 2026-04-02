-- ============================================
-- COBRANDOMX - SUPABASE SCHEMA COMPLETO
-- Ejecuta esto en Supabase SQL Editor
-- ============================================

-- EXTENSIONES
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================
-- TABLA: organizations
-- ============================================
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  rfc text,
  phone text,
  email text,
  logo_url text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text default 'trial' check (subscription_status in ('trial','active','past_due','canceled','unpaid')),
  subscription_plan text default 'basic' check (subscription_plan in ('basic','pro')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  customer_limit integer default 200,
  -- Config IA
  ai_enabled boolean default true,
  ai_tone text default 'profesional',
  allow_discounts boolean default true,
  discount_today integer default 5,
  discount_48h integer default 10,
  discount_strong integer default 20,
  -- Config horarios
  send_start_hour integer default 9,
  send_end_hour integer default 20,
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLA: profiles (usuarios)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'owner' check (role in ('owner','staff','cobrador')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLA: customers (deudores)
-- ============================================
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone_encrypted text not null, -- almacenado encriptado
  phone_display text not null,   -- últimos 4 dígitos visibles
  amount_owed numeric(12,2) not null default 0,
  amount_paid numeric(12,2) default 0,
  due_date date,
  days_overdue integer generated always as (
    case when due_date < current_date then (current_date - due_date) else 0 end
  ) stored,
  status text default 'pendiente' check (status in ('pendiente','en_negociacion','promesa_pago','pagado','no_responde','cerrado')),
  notes text,
  -- Estadísticas
  last_contact_at timestamptz,
  contact_attempts integer default 0,
  -- Referencia externa
  external_id text,
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLA: conversations
-- ============================================
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  whatsapp_thread_id text,
  status text default 'open' check (status in ('open','closed','paused')),
  ai_auto_mode boolean default false,
  last_message_at timestamptz default now(),
  unread_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, customer_id)
);

-- ============================================
-- TABLA: messages
-- ============================================
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  content text not null,
  message_type text default 'text' check (message_type in ('text','template','image','document')),
  whatsapp_message_id text unique,
  status text default 'sent' check (status in ('sending','sent','delivered','read','failed')),
  ai_generated boolean default false,
  sent_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================
-- TABLA: payment_promises
-- ============================================
create table public.payment_promises (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  conversation_id uuid references public.conversations(id),
  promised_amount numeric(12,2) not null,
  promised_date date not null,
  discount_offered numeric(5,2) default 0,
  status text default 'pending' check (status in ('pending','fulfilled','broken','expired')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLA: subscriptions (espejo Stripe)
-- ============================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLA: audit_logs
-- ============================================
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id),
  user_id uuid references auth.users(id),
  action text not null,
  resource_type text,
  resource_id uuid,
  metadata jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_customers_org on public.customers(organization_id);
create index idx_customers_status on public.customers(organization_id, status);
create index idx_customers_due_date on public.customers(organization_id, due_date);
create index idx_conversations_org on public.conversations(organization_id);
create index idx_conversations_customer on public.conversations(customer_id);
create index idx_messages_conversation on public.messages(conversation_id);
create index idx_messages_sent_at on public.messages(conversation_id, sent_at desc);
create index idx_audit_logs_org on public.audit_logs(organization_id, created_at desc);
create index idx_promises_org on public.payment_promises(organization_id);
create index idx_promises_date on public.payment_promises(organization_id, promised_date);

-- ============================================
-- TRIGGERS: updated_at automático
-- ============================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_organizations_updated before update on public.organizations
  for each row execute function public.handle_updated_at();
create trigger on_profiles_updated before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger on_customers_updated before update on public.customers
  for each row execute function public.handle_updated_at();
create trigger on_conversations_updated before update on public.conversations
  for each row execute function public.handle_updated_at();

-- ============================================
-- TRIGGER: crear profile + org al registrarse
-- ============================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_org_id uuid;
begin
  -- Crear organización
  insert into public.organizations (name, email)
  values (
    coalesce(new.raw_user_meta_data->>'company_name', 'Mi Empresa'),
    new.email
  )
  returning id into new_org_id;

  -- Crear profile
  insert into public.profiles (id, organization_id, email, full_name, role)
  values (
    new.id,
    new_org_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'owner'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- HABILITAR RLS EN TODAS LAS TABLAS
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.payment_promises enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;

-- Función helper: obtener org_id del usuario actual
create or replace function public.get_user_org_id()
returns uuid language sql security definer stable as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- Función helper: obtener rol del usuario actual
create or replace function public.get_user_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid()
$$;

-- POLICIES: organizations
create policy "users see own org" on public.organizations
  for select using (id = public.get_user_org_id());
create policy "owners update own org" on public.organizations
  for update using (id = public.get_user_org_id() and public.get_user_role() = 'owner');

-- POLICIES: profiles
create policy "users see own profile" on public.profiles
  for select using (organization_id = public.get_user_org_id());
create policy "users update own profile" on public.profiles
  for update using (id = auth.uid());

-- POLICIES: customers
create policy "org sees own customers" on public.customers
  for select using (organization_id = public.get_user_org_id());
create policy "org inserts customers" on public.customers
  for insert with check (organization_id = public.get_user_org_id());
create policy "org updates customers" on public.customers
  for update using (organization_id = public.get_user_org_id());
create policy "owners delete customers" on public.customers
  for delete using (organization_id = public.get_user_org_id() and public.get_user_role() in ('owner','staff'));

-- POLICIES: conversations
create policy "org sees own conversations" on public.conversations
  for select using (organization_id = public.get_user_org_id());
create policy "org manages conversations" on public.conversations
  for all using (organization_id = public.get_user_org_id());

-- POLICIES: messages
create policy "org sees own messages" on public.messages
  for select using (organization_id = public.get_user_org_id());
create policy "org inserts messages" on public.messages
  for insert with check (organization_id = public.get_user_org_id());

-- POLICIES: payment_promises
create policy "org sees own promises" on public.payment_promises
  for select using (organization_id = public.get_user_org_id());
create policy "org manages promises" on public.payment_promises
  for all using (organization_id = public.get_user_org_id());

-- POLICIES: subscriptions
create policy "org sees own subscription" on public.subscriptions
  for select using (organization_id = public.get_user_org_id());

-- POLICIES: audit_logs
create policy "org sees own logs" on public.audit_logs
  for select using (organization_id = public.get_user_org_id());
create policy "system inserts logs" on public.audit_logs
  for insert with check (true);

-- ============================================
-- FUNCIONES DE MÉTRICAS (para dashboard)
-- ============================================
create or replace function public.get_org_metrics(org_id uuid)
returns json language plpgsql security definer as $$
declare
  result json;
begin
  select json_build_object(
    'total_portfolio', coalesce(sum(amount_owed), 0),
    'total_recovered', coalesce(sum(amount_paid), 0),
    'total_overdue', coalesce(sum(case when status != 'pagado' then amount_owed else 0 end), 0),
    'recovery_rate', case when sum(amount_owed) > 0 then round((sum(amount_paid) / sum(amount_owed)) * 100, 2) else 0 end,
    'customers_total', count(*),
    'customers_pending', count(*) filter (where status = 'pendiente'),
    'customers_negotiating', count(*) filter (where status = 'en_negociacion'),
    'customers_promised', count(*) filter (where status = 'promesa_pago'),
    'customers_paid', count(*) filter (where status = 'pagado'),
    'customers_no_response', count(*) filter (where status = 'no_responde')
  ) into result
  from public.customers
  where organization_id = org_id;
  
  return result;
end;
$$;

-- VISTA: mensajes con info de conversación
create or replace view public.messages_with_context as
select 
  m.*,
  c.customer_id,
  cu.name as customer_name,
  cu.phone_display as customer_phone,
  cu.amount_owed,
  cu.status as customer_status
from public.messages m
join public.conversations c on m.conversation_id = c.id
join public.customers cu on c.customer_id = cu.id;

-- ============================================
-- SERVICE ROLE: política para webhooks
-- (para la API route de Stripe/WhatsApp)
-- ============================================
-- Los webhooks usan SUPABASE_SERVICE_ROLE_KEY
-- que bypassa RLS automáticamente