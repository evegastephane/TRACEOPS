-- Company details, editable by the organization's managers.
CREATE TABLE organization_profile (
 organization_id uuid PRIMARY KEY REFERENCES organization(id),
 address text, city text, phone text, email text,
 niu text, rccm text,
 services text, description text,
 contact_name text,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid NOT NULL REFERENCES app_user(id)
);

-- A field agent covers one or several places (building, floor, area, room, equipment)
-- of the sites its provider is linked to. Removal deletes the row; the audit keeps the history.
CREATE TABLE agent_assignment (
 membership_id uuid NOT NULL REFERENCES membership(id),
 zone_id uuid NOT NULL REFERENCES zone(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES app_user(id),
 PRIMARY KEY (membership_id, zone_id)
);
CREATE INDEX agent_assignment_zone ON agent_assignment(zone_id);
