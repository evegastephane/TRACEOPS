CREATE TABLE invitation (
 id uuid PRIMARY KEY,
 token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
 organization_id uuid NOT NULL REFERENCES organization(id),
 role text NOT NULL CHECK (role IN ('CLIENT_MANAGER','CLIENT_CONTROLLER','PROVIDER_MANAGER')),
 created_by uuid NOT NULL REFERENCES app_user(id),
 expires_at timestamptz NOT NULL,
 accepted_at timestamptz,
 accepted_by uuid REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE access_audit (
 id uuid PRIMARY KEY,
 actor_id uuid NOT NULL REFERENCES app_user(id),
 organization_id uuid REFERENCES organization(id),
 action text NOT NULL,
 target_id uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE auth_rate_limit (
 key_hash text PRIMARY KEY,
 attempts integer NOT NULL,
 reset_at timestamptz NOT NULL
);
