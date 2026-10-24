-- ====================================================================
-- MULTI-TENANT DENTAL SAAS PLATFORM & RBAC MIGRATION
-- Compatible with PostgreSQL 14+ (Enforces strict tenant isolation & RLS)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SUBSCRIPTION PLANS & ENTITLEMENTS
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    price_yearly NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_branches INT NOT NULL DEFAULT 1,
    max_staff INT NOT NULL DEFAULT 5,
    max_patients INT NOT NULL DEFAULT 1000,
    storage_quota_mb INT NOT NULL DEFAULT 5120, -- 5GB
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TENANTS (Clinics)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Draft', 'Provisioning', 'Active', 'Suspended', 'Offboarding'
    country VARCHAR(100) NOT NULL DEFAULT 'Nepal',
    currency VARCHAR(20) NOT NULL DEFAULT 'Rs.',
    time_zone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kathmandu',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TENANT SETTINGS & LOCALIZATION
CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_id VARCHAR(50) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    clinic_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    logo TEXT,
    phone VARCHAR(50),
    whatsapp_phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    pan_vat VARCHAR(50),
    working_hours JSONB DEFAULT '{"monday":{"open":"09:00","close":"19:00"}}'::jsonb,
    billing_policy JSONB DEFAULT '{"max_discount_percent": 15, "require_approval_above_percent": 10}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TENANT DOMAINS
CREATE TABLE IF NOT EXISTS tenant_domains (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'subdomain', -- 'subdomain', 'custom'
    is_primary BOOLEAN NOT NULL DEFAULT false,
    verified BOOLEAN NOT NULL DEFAULT false,
    verification_token VARCHAR(100),
    ssl_status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TENANT SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'trialing', 'past_due', 'canceled'
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. USERS (Identity accounts across the platform)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    global_role VARCHAR(50), -- 'PLATFORM_ADMIN', 'PLATFORM_SUPPORT', or NULL
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'revoked'
    token_version INT NOT NULL DEFAULT 1, -- Incremented to revoke all active sessions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TENANT MEMBERSHIPS & ROLES
CREATE TABLE IF NOT EXISTS tenant_memberships (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'ACCOUNTANT', 'DENTAL_ASSISTANT'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, user_id)
);

-- 8. PATIENTS (Strictly scoped by tenant_id)
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    age INT,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    address TEXT,
    province VARCHAR(100),
    district VARCHAR(100),
    municipality VARCHAR(100),
    ward VARCHAR(50),
    tole VARCHAR(100),
    allergies JSONB DEFAULT '[]'::jsonb,
    medical_history JSONB DEFAULT '[]'::jsonb,
    dental_chart JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_patients_tenant_id ON patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(tenant_id, phone);

-- 9. APPOINTMENTS (Tenant scoped)
CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    chair VARCHAR(100),
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    treatment_type VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(tenant_id, date);

-- 10. PRESCRIPTIONS (Finalized & Signed by Doctor)
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    doctor_reg_number VARCHAR(100),
    diagnosis TEXT NOT NULL,
    medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions TEXT,
    is_finalized BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, id)
);

-- 11. INVOICES & PAYMENTS (Tenant scoped, Immutable when paid)
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
    is_finalized BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, id)
);

-- 12. AUDIT LOGS (Immutable Security and Access Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) REFERENCES tenants(id) ON DELETE SET NULL,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS', -- 'SUCCESS', 'DENIED', 'ERROR'
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_id ON audit_logs(tenant_id, created_at DESC);

-- 13. SUPPORT ACCESS GRANTS (Audited & Time-Limited)
CREATE TABLE IF NOT EXISTS support_access_grants (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    admin_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED', 'EXPIRED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Patients Isolation Policy
CREATE POLICY tenant_isolation_patients ON patients
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Appointments Isolation Policy
CREATE POLICY tenant_isolation_appointments ON appointments
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Prescriptions Isolation Policy
CREATE POLICY tenant_isolation_prescriptions ON prescriptions
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));

-- Invoices Isolation Policy
CREATE POLICY tenant_isolation_invoices ON invoices
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));
