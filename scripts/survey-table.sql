-- Run this in your Supabase SQL editor before using the survey feature

create table if not exists citizen_surveys (
  id                  bigserial primary key,
  reference_number    text unique not null,

  -- Location (pre-filled from report)
  county              text not null,
  community           text not null,

  -- Road condition & safety (1 = worst, 5 = best)
  road_rating         int  not null check (road_rating  between 1 and 5),
  safety_rating       int  not null check (safety_rating between 1 and 5),
  road_problems       text[] not null default '{}',

  -- Maintenance
  maintenance_done    text not null,   -- 'yes' | 'no' | 'unsure'
  maint_satisfaction  int  check (maint_satisfaction between 1 and 5),
  maint_delivered     text,            -- 'yes' | 'partially' | 'no'

  -- Socioeconomic impact
  impact_areas        text[] not null default '{}',
  transport_cost      text not null,   -- 'increased' | 'same' | 'decreased'

  -- Reporting experience & NRF
  nrf_aware           boolean not null,
  nrf_satisfaction    int  check (nrf_satisfaction between 1 and 5),
  feedback            text,

  submitted_at        timestamptz not null default now()
);

alter table citizen_surveys enable row level security;

create policy "Service role full access" on citizen_surveys
  using (true) with check (true);
