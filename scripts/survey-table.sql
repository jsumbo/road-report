-- Run this in your Supabase SQL editor before using the survey feature
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS guards)
-- NOTE: this replaces the old questionnaire's columns entirely. If citizen_surveys
-- already has rows from the previous survey, either clear them first or backfill
-- the new NOT NULL columns manually before running the "set not null" statements below.

create table if not exists citizen_surveys (
  id                  bigserial primary key,
  reference_number    text unique not null,

  -- Location (pre-filled from report)
  report_reference    text,
  county              text not null,
  community           text not null,

  submitted_at        timestamptz not null default now()
);

-- Q1: road user type
alter table citizen_surveys add column if not exists road_user_type text;
-- Retired: road condition rating — road conditions are captured by reports, not the survey (kept for historical rows)
alter table citizen_surveys add column if not exists road_rating int;
-- Retired: road problems observed (kept for historical rows)
alter table citizen_surveys add column if not exists road_problems text[] not null default '{}';
-- Q4: is the road holding up well after completion?
alter table citizen_surveys add column if not exists holding_up text;
-- Q5: authority response time to damage
alter table citizen_surveys add column if not exists response_time text;
-- Q6: improvement to transportation and movement
alter table citizen_surveys add column if not exists transport_improvement text;
-- Q7: improvement to access to markets/schools/hospitals/businesses
alter table citizen_surveys add column if not exists access_improvement text;
-- Q8: aware maintenance is funded via fuel levy / NRF
alter table citizen_surveys add column if not exists nrf_aware boolean;
-- Q9: value for money from fuel-levy funded projects (5 = Strongly Agree ... 1 = Strongly Disagree)
alter table citizen_surveys add column if not exists value_for_money int;
-- Q10: overall satisfaction with NRF-funded roads (5 = Very Satisfied ... 1 = Very Dissatisfied)
alter table citizen_surveys add column if not exists nrf_satisfaction int;
-- Optional free-text feedback
alter table citizen_surveys add column if not exists feedback text;

-- Drop columns from the previous survey questionnaire
alter table citizen_surveys drop column if exists safety_rating;
alter table citizen_surveys drop column if exists maintenance_done;
alter table citizen_surveys drop column if exists maint_satisfaction;
alter table citizen_surveys drop column if exists maint_delivered;
alter table citizen_surveys drop column if exists impact_areas;
alter table citizen_surveys drop column if exists transport_cost;

-- Constraints (added after backfill-safe column creation above)
alter table citizen_surveys alter column road_user_type set not null;
alter table citizen_surveys alter column road_rating drop not null;
alter table citizen_surveys alter column holding_up set not null;
alter table citizen_surveys alter column response_time set not null;
alter table citizen_surveys alter column transport_improvement set not null;
alter table citizen_surveys alter column access_improvement set not null;
alter table citizen_surveys alter column nrf_aware set not null;
alter table citizen_surveys alter column value_for_money set not null;
alter table citizen_surveys alter column nrf_satisfaction set not null;

do $$ begin
  alter table citizen_surveys add constraint citizen_surveys_road_user_type_check
    check (road_user_type in ('driver', 'pedestrian', 'public_transport', 'trader'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table citizen_surveys add constraint citizen_surveys_road_rating_check
    check (road_rating between 1 and 5);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table citizen_surveys add constraint citizen_surveys_holding_up_check
    check (holding_up in ('yes', 'somewhat', 'no'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table citizen_surveys add constraint citizen_surveys_response_time_check
    check (response_time in ('within_1m', 'within_3m', 'within_6m', 'over_6m', 'no_response'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table citizen_surveys add constraint citizen_surveys_transport_improvement_check
    check (transport_improvement in ('significantly', 'somewhat', 'no_change', 'worse'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table citizen_surveys add constraint citizen_surveys_access_improvement_check
    check (access_improvement in ('significantly', 'somewhat', 'no_change', 'not_at_all'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table citizen_surveys add constraint citizen_surveys_value_for_money_check
    check (value_for_money between 1 and 5);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table citizen_surveys add constraint citizen_surveys_nrf_satisfaction_check
    check (nrf_satisfaction between 1 and 5);
exception when duplicate_object then null; end $$;

alter table citizen_surveys enable row level security;

do $$ begin
  create policy "Service role full access" on citizen_surveys
    using (true) with check (true);
exception when duplicate_object then null; end $$;
