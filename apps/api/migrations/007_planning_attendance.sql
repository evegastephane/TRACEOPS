-- A provider works for a client only after a tender it accepted: invitations get an answer, awards an acceptance.
ALTER TABLE tender_invitation ADD COLUMN response text CHECK (response IN ('ACCEPTED','DECLINED'));
ALTER TABLE tender_invitation ADD COLUMN response_reason text;
ALTER TABLE tender_invitation ADD COLUMN responded_at timestamptz;
ALTER TABLE tender_invitation ADD COLUMN responded_by uuid REFERENCES app_user(id);
-- Providers that already sent an offer took part.
UPDATE tender_invitation i SET response = 'ACCEPTED', responded_at = b.submitted_at
FROM bid b WHERE b.tender_id = i.tender_id AND b.provider_id = i.provider_id AND b.source = 'ONLINE';

ALTER TABLE bid DROP CONSTRAINT bid_status_check;
ALTER TABLE bid ADD CONSTRAINT bid_status_check CHECK (status IN ('SUBMITTED','SHORTLISTED','REJECTED','AWARDED','NOT_RETAINED','DECLINED'));

-- An awarded contract waits for the provider's answer before any work.
ALTER TABLE contract DROP CONSTRAINT contract_status_check;
ALTER TABLE contract ADD CONSTRAINT contract_status_check CHECK (status IN ('PROPOSED','ACTIVE','DECLINED','CLOSED'));
ALTER TABLE contract ADD COLUMN responded_at timestamptz;
ALTER TABLE contract ADD COLUMN responded_by uuid REFERENCES app_user(id);
ALTER TABLE contract ADD COLUMN decline_reason text;
UPDATE contract SET responded_at = created_at WHERE status IN ('ACTIVE','CLOSED');
-- An accepted contract on a site links its provider to that site.
INSERT INTO service_agreement(id, client_id, site_id, provider_id, starts_at)
SELECT gen_random_uuid(), x.client_id, x.site_id, x.provider_id, x.created_at
FROM (SELECT DISTINCT ON (c.site_id, c.provider_id) c.client_id, c.site_id, c.provider_id, c.created_at FROM contract c
      WHERE c.status = 'ACTIVE' AND c.site_id IS NOT NULL ORDER BY c.site_id, c.provider_id, c.created_at) x
WHERE NOT EXISTS (SELECT 1 FROM service_agreement a WHERE a.site_id = x.site_id AND a.provider_id = x.provider_id AND a.active);

-- Earlier plannings brought in from Gantt files (MS Project, GanttProject, spreadsheets), shown beside the live schedule.
CREATE TABLE plan (
 id uuid PRIMARY KEY,
 organization_id uuid NOT NULL REFERENCES organization(id),
 contract_id uuid REFERENCES contract(id),
 site_id uuid REFERENCES site(id),
 title text NOT NULL CHECK (length(trim(title)) > 0),
 source text,
 format text NOT NULL CHECK (format IN ('CSV','MSPROJECT_XML','GANTTPROJECT','PASTE')),
 active boolean NOT NULL DEFAULT true,
 created_by uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX plan_organization ON plan(organization_id);
CREATE TABLE plan_task (
 id uuid PRIMARY KEY,
 plan_id uuid NOT NULL REFERENCES plan(id) ON DELETE CASCADE,
 position int NOT NULL,
 level int NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 9),
 name text NOT NULL CHECK (length(trim(name)) > 0),
 start_date date NOT NULL,
 end_date date NOT NULL,
 progress int CHECK (progress BETWEEN 0 AND 100),
 milestone boolean NOT NULL DEFAULT false,
 resource text,
 predecessors text,
 CHECK (end_date >= start_date)
);
CREATE INDEX plan_task_plan ON plan_task(plan_id, position);

-- QR codes posted on the sites: an agent scans one with the phone to record arrival and departure, or declares an absence.
CREATE TABLE attendance_point (
 id uuid PRIMARY KEY,
 client_id uuid NOT NULL REFERENCES organization(id),
 site_id uuid NOT NULL REFERENCES site(id),
 zone_id uuid REFERENCES zone(id),
 label text NOT NULL CHECK (length(trim(label)) > 0),
 token text NOT NULL UNIQUE CHECK (token ~ '^[0-9a-f]{32}$'),
 active boolean NOT NULL DEFAULT true,
 created_by uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attendance_point_site ON attendance_point(site_id);
CREATE TABLE attendance (
 id uuid PRIMARY KEY,
 point_id uuid REFERENCES attendance_point(id),
 client_id uuid NOT NULL REFERENCES organization(id),
 site_id uuid NOT NULL REFERENCES site(id),
 provider_id uuid NOT NULL REFERENCES organization(id),
 membership_id uuid NOT NULL REFERENCES membership(id),
 user_id uuid NOT NULL REFERENCES app_user(id),
 intervention_id uuid REFERENCES intervention(id),
 kind text NOT NULL CHECK (kind IN ('IN','OUT','ABSENT')),
 at timestamptz NOT NULL DEFAULT now(),
 reason text,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (kind <> 'ABSENT' OR reason IS NOT NULL)
);
CREATE INDEX attendance_site ON attendance(site_id, at);
CREATE INDEX attendance_provider ON attendance(provider_id, at);
CREATE INDEX attendance_user ON attendance(user_id, at);
