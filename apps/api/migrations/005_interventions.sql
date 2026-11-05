-- Recurring cleaning programmes under a contract: each passage becomes its own intervention.
CREATE TABLE programme (
 id uuid PRIMARY KEY,
 client_id uuid NOT NULL REFERENCES organization(id),
 provider_id uuid NOT NULL REFERENCES organization(id),
 site_id uuid NOT NULL REFERENCES site(id),
 title text NOT NULL CHECK (length(trim(title)) > 0),
 description text,
 weekdays int[] NOT NULL CHECK (cardinality(weekdays) > 0 AND weekdays <@ ARRAY[1,2,3,4,5,6,7]),
 start_date date NOT NULL,
 end_date date NOT NULL,
 start_time time NOT NULL,
 end_time time NOT NULL,
 zone_ids uuid[] NOT NULL DEFAULT '{}',
 tasks text[] NOT NULL DEFAULT '{}',
 team uuid[] NOT NULL DEFAULT '{}',
 lead_membership_id uuid REFERENCES membership(id),
 active boolean NOT NULL DEFAULT true,
 created_by uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (end_date >= start_date),
 CHECK (end_time > start_time)
);

CREATE SEQUENCE intervention_number START 1;
CREATE TABLE intervention (
 id uuid PRIMARY KEY,
 number int NOT NULL UNIQUE DEFAULT nextval('intervention_number'),
 client_id uuid NOT NULL REFERENCES organization(id),
 provider_id uuid NOT NULL REFERENCES organization(id),
 site_id uuid NOT NULL REFERENCES site(id),
 programme_id uuid REFERENCES programme(id),
 kind text NOT NULL CHECK (kind IN ('CLEANING','MAINTENANCE')),
 title text NOT NULL CHECK (length(trim(title)) > 0),
 description text,
 priority text NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL','URGENT')),
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,
 status text NOT NULL CHECK (status IN ('REQUESTED','QUOTE_SUBMITTED','QUOTE_REFUSED','PLANNED','ASSIGNED','IN_PROGRESS','UNDER_REVIEW','REWORK','ACCEPTED','CANCELLED')),
 quote_required boolean NOT NULL DEFAULT false,
 report_note text,
 started_at timestamptz,
 submitted_at timestamptz,
 submitted_by uuid REFERENCES app_user(id),
 accepted_at timestamptz,
 round int NOT NULL DEFAULT 1,
 created_by uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (ends_at > starts_at)
);
CREATE INDEX intervention_client ON intervention(client_id, starts_at);
CREATE INDEX intervention_provider ON intervention(provider_id, starts_at);
CREATE INDEX intervention_programme ON intervention(programme_id);

CREATE TABLE intervention_zone (
 intervention_id uuid NOT NULL REFERENCES intervention(id) ON DELETE CASCADE,
 zone_id uuid NOT NULL REFERENCES zone(id),
 PRIMARY KEY (intervention_id, zone_id)
);
CREATE TABLE intervention_task (
 id uuid PRIMARY KEY,
 intervention_id uuid NOT NULL REFERENCES intervention(id) ON DELETE CASCADE,
 position int NOT NULL,
 label text NOT NULL,
 status text NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO','DONE','IMPOSSIBLE')),
 note text,
 rework boolean NOT NULL DEFAULT false,
 done_by uuid REFERENCES app_user(id),
 done_at timestamptz
);
CREATE TABLE intervention_agent (
 intervention_id uuid NOT NULL REFERENCES intervention(id) ON DELETE CASCADE,
 membership_id uuid NOT NULL REFERENCES membership(id),
 lead boolean NOT NULL DEFAULT false,
 PRIMARY KEY (intervention_id, membership_id)
);
CREATE TABLE quote (
 id uuid PRIMARY KEY,
 intervention_id uuid NOT NULL REFERENCES intervention(id) ON DELETE CASCADE,
 amount_xaf bigint NOT NULL CHECK (amount_xaf > 0),
 delay_days int NOT NULL CHECK (delay_days >= 0),
 description text NOT NULL,
 status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','REFUSED')),
 reason text,
 created_by uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 decided_by uuid REFERENCES app_user(id),
 decided_at timestamptz
);
CREATE TABLE intervention_photo (
 id uuid PRIMARY KEY,
 intervention_id uuid NOT NULL REFERENCES intervention(id) ON DELETE CASCADE,
 task_id uuid REFERENCES intervention_task(id),
 phase text NOT NULL CHECK (phase IN ('BEFORE','AFTER')),
 mime text NOT NULL CHECK (mime IN ('image/jpeg','image/png')),
 data bytea NOT NULL,
 size int NOT NULL,
 round int NOT NULL DEFAULT 1,
 uploaded_by uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
-- An anomaly lives its own life: accepting the work never closes it, only the client does.
CREATE TABLE anomaly (
 id uuid PRIMARY KEY,
 intervention_id uuid NOT NULL REFERENCES intervention(id) ON DELETE CASCADE,
 zone_id uuid REFERENCES zone(id),
 title text NOT NULL,
 description text,
 status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLUTION_PROPOSED','CLOSED')),
 resolution text,
 closing_note text,
 created_by uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 closed_by uuid REFERENCES app_user(id),
 closed_at timestamptz
);
-- Every step of an intervention, in order: the timeline and the control decisions.
CREATE TABLE intervention_event (
 id uuid PRIMARY KEY,
 intervention_id uuid NOT NULL REFERENCES intervention(id) ON DELETE CASCADE,
 actor_id uuid NOT NULL REFERENCES app_user(id),
 action text NOT NULL,
 from_status text,
 to_status text,
 reason text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX intervention_event_item ON intervention_event(intervention_id, created_at);
