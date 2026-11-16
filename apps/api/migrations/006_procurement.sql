-- Tenders, the offers received, the providers retained, the follow-up of cost, delay and quality, and payments.

-- A client's own tender form, built for one kind of service: sections and fields, the reply asked from the
-- providers, the award criteria and the quality criteria used once the work runs. The shared library lives in code.
CREATE TABLE tender_template (
 id uuid PRIMARY KEY,
 client_id uuid NOT NULL REFERENCES organization(id),
 service_type text NOT NULL CHECK (service_type IN ('CLEANING','MAINTENANCE','HVAC','SECURITY','PEST','GREEN','WASTE','OTHER')),
 name text NOT NULL CHECK (length(trim(name)) > 0),
 description text,
 source text,
 sections jsonb NOT NULL DEFAULT '[]',
 questions jsonb NOT NULL DEFAULT '[]',
 criteria jsonb NOT NULL DEFAULT '[]',
 quality_criteria jsonb NOT NULL DEFAULT '[]',
 active boolean NOT NULL DEFAULT true,
 created_by uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tender_template_client ON tender_template(client_id);

CREATE SEQUENCE tender_number START 1;
CREATE TABLE tender (
 id uuid PRIMARY KEY,
 number int NOT NULL UNIQUE DEFAULT nextval('tender_number'),
 client_id uuid NOT NULL REFERENCES organization(id),
 site_id uuid REFERENCES site(id),
 template_name text,
 service_type text NOT NULL CHECK (service_type IN ('CLEANING','MAINTENANCE','HVAC','SECURITY','PEST','GREEN','WASTE','OTHER')),
 title text NOT NULL CHECK (length(trim(title)) > 0),
 object text,
 budget_xaf bigint CHECK (budget_xaf IS NULL OR budget_xaf > 0),
 deadline timestamptz NOT NULL,
 start_date date,
 duration_days int CHECK (duration_days IS NULL OR duration_days > 0),
 payment_terms_days int NOT NULL DEFAULT 30 CHECK (payment_terms_days BETWEEN 0 AND 180),
 sections jsonb NOT NULL DEFAULT '[]',
 questions jsonb NOT NULL DEFAULT '[]',
 criteria jsonb NOT NULL DEFAULT '[]',
 quality_criteria jsonb NOT NULL DEFAULT '[]',
 status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','CLOSED','AWARDED','CANCELLED')),
 decision_note text,
 created_by uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz,
 closed_at timestamptz,
 awarded_at timestamptz
);
CREATE INDEX tender_client ON tender(client_id, created_at);

CREATE TABLE tender_invitation (
 tender_id uuid NOT NULL REFERENCES tender(id) ON DELETE CASCADE,
 provider_id uuid NOT NULL REFERENCES organization(id),
 invited_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (tender_id, provider_id)
);
CREATE INDEX tender_invitation_provider ON tender_invitation(provider_id);

-- One offer per provider and tender: sent online by the provider, or recorded by the client from a paper or e-mail reply.
CREATE TABLE bid (
 id uuid PRIMARY KEY,
 tender_id uuid NOT NULL REFERENCES tender(id) ON DELETE CASCADE,
 provider_id uuid NOT NULL REFERENCES organization(id),
 amount_xaf bigint NOT NULL CHECK (amount_xaf > 0),
 delay_days int NOT NULL CHECK (delay_days >= 0),
 content text NOT NULL,
 strengths text,
 answers jsonb NOT NULL DEFAULT '{}',
 source text NOT NULL DEFAULT 'ONLINE' CHECK (source IN ('ONLINE','RECORDED')),
 status text NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','SHORTLISTED','REJECTED','AWARDED','NOT_RETAINED')),
 scores jsonb NOT NULL DEFAULT '{}',
 review_note text,
 status_reason text,
 submitted_by uuid NOT NULL REFERENCES app_user(id),
 submitted_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (tender_id, provider_id)
);

-- A provider retained after a tender: the commitments of its offer, followed in cost, delay and quality until the final review.
CREATE SEQUENCE contract_number START 1;
CREATE TABLE contract (
 id uuid PRIMARY KEY,
 number int NOT NULL UNIQUE DEFAULT nextval('contract_number'),
 tender_id uuid REFERENCES tender(id),
 bid_id uuid UNIQUE REFERENCES bid(id),
 client_id uuid NOT NULL REFERENCES organization(id),
 provider_id uuid NOT NULL REFERENCES organization(id),
 site_id uuid REFERENCES site(id),
 title text NOT NULL CHECK (length(trim(title)) > 0),
 scope text,
 committed_amount_xaf bigint NOT NULL CHECK (committed_amount_xaf > 0),
 committed_days int NOT NULL CHECK (committed_days > 0),
 start_date date NOT NULL,
 planned_end_date date NOT NULL,
 payment_terms_days int NOT NULL DEFAULT 30 CHECK (payment_terms_days BETWEEN 0 AND 180),
 quality_target numeric(3,1) NOT NULL DEFAULT 7 CHECK (quality_target BETWEEN 1 AND 10),
 quality_criteria jsonb NOT NULL DEFAULT '[]',
 status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CLOSED')),
 actual_end_date date,
 closing_note text,
 closed_at timestamptz,
 closed_by uuid REFERENCES app_user(id),
 created_by uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (planned_end_date >= start_date)
);
CREATE INDEX contract_client ON contract(client_id);
CREATE INDEX contract_provider ON contract(provider_id);

-- Each service delivered under a contract is accepted or rejected on its own; only an accepted one becomes payable.
CREATE TABLE contract_delivery (
 id uuid PRIMARY KEY,
 contract_id uuid NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
 position int NOT NULL,
 label text NOT NULL CHECK (length(trim(label)) > 0),
 planned_date date NOT NULL,
 amount_xaf bigint NOT NULL CHECK (amount_xaf > 0),
 delivered_at timestamptz,
 delivered_by uuid REFERENCES app_user(id),
 delivery_note text,
 decision text NOT NULL DEFAULT 'PENDING' CHECK (decision IN ('PENDING','ACCEPTED','REJECTED')),
 decision_reason text,
 decided_at timestamptz,
 decided_by uuid REFERENCES app_user(id),
 created_by uuid NOT NULL REFERENCES app_user(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contract_delivery_contract ON contract_delivery(contract_id, position);

-- Quality evaluation by an internal technician: a mark from 1 to 10 per criterion, each with its justification.
CREATE TABLE contract_evaluation (
 id uuid PRIMARY KEY,
 contract_id uuid NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
 delivery_id uuid REFERENCES contract_delivery(id) ON DELETE SET NULL,
 evaluator_id uuid NOT NULL REFERENCES app_user(id),
 evaluated_on date NOT NULL,
 scores jsonb NOT NULL,
 average numeric(4,2) NOT NULL CHECK (average BETWEEN 1 AND 10),
 comment text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contract_evaluation_contract ON contract_evaluation(contract_id, evaluated_on);

-- The payment of an accepted service. Acceptance (accepted or rejected) and payment (pending or paid) stay two separate facts:
-- the due date is set when the service is accepted, a number of days after it.
CREATE TABLE payment (
 id uuid PRIMARY KEY,
 client_id uuid NOT NULL REFERENCES organization(id),
 provider_id uuid NOT NULL REFERENCES organization(id),
 delivery_id uuid UNIQUE REFERENCES contract_delivery(id) ON DELETE CASCADE,
 intervention_id uuid UNIQUE REFERENCES intervention(id) ON DELETE CASCADE,
 label text NOT NULL,
 amount_xaf bigint NOT NULL CHECK (amount_xaf > 0),
 accepted_at timestamptz NOT NULL,
 terms_days int NOT NULL CHECK (terms_days >= 0),
 due_date date NOT NULL,
 status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID')),
 paid_on date,
 paid_amount_xaf bigint CHECK (paid_amount_xaf IS NULL OR paid_amount_xaf > 0),
 reference text,
 paid_by uuid REFERENCES app_user(id),
 paid_recorded_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (num_nonnulls(delivery_id, intervention_id) = 1),
 CHECK (status = 'PENDING' OR paid_on IS NOT NULL)
);
CREATE INDEX payment_client ON payment(client_id, due_date);
CREATE INDEX payment_provider ON payment(provider_id, due_date);

-- Every step of a tender or a contract, in order, with its real author.
CREATE TABLE procurement_event (
 id uuid PRIMARY KEY,
 tender_id uuid REFERENCES tender(id) ON DELETE CASCADE,
 contract_id uuid REFERENCES contract(id) ON DELETE CASCADE,
 actor_id uuid NOT NULL REFERENCES app_user(id),
 action text NOT NULL,
 reason text,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (num_nonnulls(tender_id, contract_id) >= 1)
);
CREATE INDEX procurement_event_tender ON procurement_event(tender_id, created_at);
CREATE INDEX procurement_event_contract ON procurement_event(contract_id, created_at);

-- Maintenance already accepted with an accepted quote is payable 30 days after its acceptance.
INSERT INTO payment(id, client_id, provider_id, intervention_id, label, amount_xaf, accepted_at, terms_days, due_date)
SELECT gen_random_uuid(), i.client_id, i.provider_id, i.id, i.title, q.amount_xaf, i.accepted_at, 30,
       ((i.accepted_at AT TIME ZONE 'Africa/Douala')::date + 30)
FROM intervention i
JOIN LATERAL (SELECT amount_xaf FROM quote WHERE intervention_id = i.id AND status = 'ACCEPTED' ORDER BY created_at DESC LIMIT 1) q ON true
WHERE i.status = 'ACCEPTED' AND i.accepted_at IS NOT NULL;
