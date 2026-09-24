SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  artist_name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) NOT NULL,
  data MEDIUMTEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id),
  KEY idx_sessions_expires_at (expires_at)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS distribution_releases (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  artist_name VARCHAR(160) NOT NULL,
  release_type ENUM('single', 'ep', 'album') NOT NULL,
  release_date DATE NOT NULL,
  genre VARCHAR(100) NOT NULL,
  label VARCHAR(160) NOT NULL,
  upc VARCHAR(32) DEFAULT NULL,
  status ENUM('draft', 'submitted', 'processing', 'scheduled', 'live', 'rejected') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_distribution_releases_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  UNIQUE KEY uq_distribution_releases_user_upc (user_id, upc),
  KEY idx_distribution_releases_user_created (user_id, created_at),
  KEY idx_distribution_releases_user_release_date (user_id, release_date),
  KEY idx_distribution_releases_user_status (user_id, status)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS release_tracks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  release_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  isrc VARCHAR(24) DEFAULT NULL,
  track_number SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_release_tracks_release
    FOREIGN KEY (release_id) REFERENCES distribution_releases (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_release_tracks_track_number
    CHECK (track_number >= 1),
  UNIQUE KEY uq_release_tracks_position (release_id, track_number),
  UNIQUE KEY uq_release_tracks_isrc (isrc),
  KEY idx_release_tracks_release (release_id)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publishing_works (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  work_title VARCHAR(200) NOT NULL,
  alternate_title VARCHAR(200) DEFAULT NULL,
  writers VARCHAR(2000) NOT NULL,
  ownership_share DECIMAL(5,2) UNSIGNED NOT NULL,
  performing_rights_organization VARCHAR(120) NOT NULL,
  ipi_number VARCHAR(32) DEFAULT NULL,
  registration_status ENUM('draft', 'pending', 'registered', 'rejected') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_publishing_works_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_publishing_works_ownership_share
    CHECK (ownership_share >= 0.00 AND ownership_share <= 100.00),
  KEY idx_publishing_works_user_created (user_id, created_at),
  KEY idx_publishing_works_user_status (user_id, registration_status),
  KEY idx_publishing_works_user_title (user_id, work_title)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  campaign_name VARCHAR(200) NOT NULL,
  release_title VARCHAR(200) NOT NULL,
  objective ENUM(
    'awareness',
    'pre_saves',
    'streams',
    'engagement',
    'followers',
    'sales',
    'fan_growth'
  ) NOT NULL,
  channel ENUM(
    'social',
    'playlisting',
    'press',
    'radio',
    'influencer',
    'email',
    'social_media',
    'playlist_pitching',
    'email_marketing',
    'influencer_marketing'
  ) NOT NULL,
  budget DECIMAL(12,2) UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('planned', 'active', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_marketing_campaigns_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT chk_marketing_campaigns_budget
    CHECK (budget >= 0.00),
  CONSTRAINT chk_marketing_campaigns_dates
    CHECK (end_date >= start_date),
  KEY idx_marketing_campaigns_user_created (user_id, created_at),
  KEY idx_marketing_campaigns_user_status (user_id, status),
  KEY idx_marketing_campaigns_user_start_date (user_id, start_date)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;