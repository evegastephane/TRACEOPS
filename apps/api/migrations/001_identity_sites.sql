CREATE TABLE app_user (
 id uuid PRIMARY KEY,
 login text NOT NULL,
 password_hash text NOT NULL,
 display_name text NOT NULL,
 active boolean NOT NULL DEFAULT true,
 must_change_password boolean NOT NULL DEFAULT true,
 locale text NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (length(trim(login)) > 0)
);
CREATE UNIQUE INDEX app_user_login_ci ON app_user (lower(login));

CREATE TABLE organization (
 id uuid PRIMARY KEY,
 name text NOT NULL CHECK (length(trim(name)) > 0),
 kind text NOT NULL CHECK (kind IN ('CLIENT', 'PROVIDER')),
 active boolean NOT NULL DEFAULT true,
 UNIQUE (id, kind)
);
CREATE TABLE membership (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id),
 organization_id uuid NOT NULL REFERENCES organization(id),
 active boolean NOT NULL DEFAULT true,
 UNIQUE (user_id, organization_id),
 UNIQUE (id, organization_id)
);
CREATE TABLE membership_role (
 membership_id uuid NOT NULL REFERENCES membership(id),
 role text NOT NULL CHECK (role IN ('CLIENT_MANAGER','CLIENT_CONTROLLER','PROVIDER_MANAGER','FIELD_AGENT')),
 PRIMARY KEY (membership_id, role)
);
CREATE TABLE platform_admin (
 user_id uuid PRIMARY KEY REFERENCES app_user(id),
 active boolean NOT NULL DEFAULT true
);
CREATE TABLE user_session (
 token_hash bytea PRIMARY KEY CHECK (octet_length(token_hash) = 32),
 user_id uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 CHECK (expires_at > created_at)
);
CREATE INDEX user_session_owner ON user_session(user_id);

CREATE TABLE site (
 id uuid PRIMARY KEY,
 client_id uuid NOT NULL,
 client_kind text NOT NULL DEFAULT 'CLIENT' CHECK (client_kind = 'CLIENT'),
 name text NOT NULL CHECK (length(trim(name)) > 0),
 sector text NOT NULL,
 timezone text NOT NULL DEFAULT 'Africa/Douala',
 active boolean NOT NULL DEFAULT true,
 FOREIGN KEY (client_id, client_kind) REFERENCES organization(id, kind),
 UNIQUE (id, client_id)
);
CREATE TABLE zone (
 id uuid PRIMARY KEY,
 site_id uuid NOT NULL REFERENCES site(id),
 parent_id uuid,
 code text NOT NULL CHECK (length(trim(code)) > 0),
 name text NOT NULL CHECK (length(trim(name)) > 0),
 kind text NOT NULL CHECK (kind IN ('BUILDING','FLOOR','AREA','ROOM','EQUIPMENT')),
 active boolean NOT NULL DEFAULT true,
 UNIQUE (id, site_id),
 UNIQUE (site_id, code),
 FOREIGN KEY (parent_id, site_id) REFERENCES zone(id, site_id),
 CHECK (parent_id IS DISTINCT FROM id)
);
-- Serializes hierarchy writes per site, including concurrent cycle attempts.
CREATE FUNCTION check_zone_parent() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE found_cycle boolean;
BEGIN
 IF TG_OP = 'UPDATE' AND (NEW.site_id <> OLD.site_id OR NEW.id <> OLD.id) THEN
   RAISE EXCEPTION 'Zone identity and site are immutable';
 END IF;
 PERFORM 1 FROM site WHERE id = NEW.site_id FOR UPDATE;
 IF NEW.parent_id IS NOT NULL THEN
   WITH RECURSIVE ancestors AS (
     SELECT id, parent_id FROM zone WHERE id = NEW.parent_id AND site_id = NEW.site_id
     UNION
     SELECT z.id, z.parent_id FROM zone z JOIN ancestors a ON z.id = a.parent_id
       WHERE z.site_id = NEW.site_id
   ) SELECT EXISTS(SELECT 1 FROM ancestors WHERE id = NEW.id) INTO found_cycle;
   IF found_cycle THEN RAISE EXCEPTION 'Zone hierarchy cycle'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zone_parent_guard BEFORE INSERT OR UPDATE ON zone
 FOR EACH ROW EXECUTE FUNCTION check_zone_parent();

CREATE TABLE service_agreement (
 id uuid PRIMARY KEY,
 client_id uuid NOT NULL,
 site_id uuid NOT NULL,
 provider_id uuid NOT NULL,
 provider_kind text NOT NULL DEFAULT 'PROVIDER' CHECK (provider_kind = 'PROVIDER'),
 active boolean NOT NULL DEFAULT true,
 starts_at timestamptz NOT NULL,
 ends_at timestamptz,
 FOREIGN KEY (site_id, client_id) REFERENCES site(id, client_id),
 FOREIGN KEY (provider_id, provider_kind) REFERENCES organization(id, kind),
 CHECK (ends_at IS NULL OR ends_at > starts_at),
 UNIQUE (id, client_id, site_id, provider_id)
);
CREATE TABLE site_grant (
 membership_id uuid NOT NULL REFERENCES membership(id),
 site_id uuid NOT NULL REFERENCES site(id),
 PRIMARY KEY (membership_id, site_id)
);
-- Application authorization must verify organization/agreement in addition to grants.
-- No public CRUD is exposed by this migration.
