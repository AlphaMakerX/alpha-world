-- Base schema for Alpha World (PostgreSQL)
-- Tables: users, plots, buildings

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(32) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_username_length_chk CHECK (char_length(username) BETWEEN 3 AND 32)
);

CREATE TABLE IF NOT EXISTS plots (
  id BIGSERIAL PRIMARY KEY,
  x INT NOT NULL,
  y INT NOT NULL,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plots_coordinates_unique UNIQUE (x, y),
  CONSTRAINT plots_status_chk CHECK (status IN ('available', 'owned', 'locked')),
  CONSTRAINT plots_price_chk CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS buildings (
  id BIGSERIAL PRIMARY KEY,
  plot_id BIGINT NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  building_type VARCHAR(32) NOT NULL,
  level INT NOT NULL DEFAULT 1,
  position_x INT NOT NULL DEFAULT 0,
  position_y INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT buildings_level_chk CHECK (level >= 1),
  CONSTRAINT buildings_plot_position_unique UNIQUE (plot_id, position_x, position_y)
);

CREATE INDEX IF NOT EXISTS idx_plots_owner_user_id ON plots(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_plots_status ON plots(status);
CREATE INDEX IF NOT EXISTS idx_buildings_plot_id ON buildings(plot_id);
CREATE INDEX IF NOT EXISTS idx_buildings_owner_user_id ON buildings(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_buildings_type ON buildings(building_type);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_plots_updated_at ON plots;
CREATE TRIGGER trg_plots_updated_at
BEFORE UPDATE ON plots
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_buildings_updated_at ON buildings;
CREATE TRIGGER trg_buildings_updated_at
BEFORE UPDATE ON buildings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
