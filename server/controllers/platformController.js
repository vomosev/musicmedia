const { pool } = require('../config/db');

const RELEASE_TYPES = new Set(['single', 'ep', 'album']);
const WORK_STATUSES = new Set(['draft', 'pending', 'registered']);
const CAMPAIGN_OBJECTIVES = new Set([
  'awareness',
  'streams',
  'pre_saves',
  'fan_growth',
]);
const CAMPAIGN_CHANNELS = new Set([
  'social_media',
  'playlist_pitching',
  'email_marketing',
  'influencer_marketing',
]);

const ISRC_PATTERN = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
const UPC_PATTERN = /^\d{12,13}$/;

function validationError(res, fields, message = 'Please correct the highlighted fields.') {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message,
      fields,
    },
  });
}

function boundedText(value, options = {}) {
  const {
    required = false,
    max = 255,
    field = 'value',
  } = options;

  if (value === null || value === undefined) {
    return required
      ? { error: `${field} is required.` }
      : { value: null };
  }

  if (typeof value !== 'string') {
    return { error: `${field} must be text.` };
  }

  const normalized = value.trim();

  if (!normalized) {
    return required
      ? { error: `${field} is required.` }
      : { value: null };
  }

  if (normalized.length > max) {
    return { error: `${field} must be ${max} characters or fewer.` };
  }

  return { value: normalized };
}

function enumValue(value, allowed, field) {
  if (typeof value !== 'string' || !value.trim()) {
    return { error: `${field} is required.` };
  }

  const normalized = value.trim().toLowerCase();

  if (!allowed.has(normalized)) {
    return { error: `Select a valid ${field.toLowerCase()}.` };
  }

  return { value: normalized };
}

function isoDate(value, field) {
  if (typeof value !== 'string') {
    return { error: `${field} is required.` };
  }

  const normalized = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

  if (!match) {
    return { error: `${field} must be a valid date.` };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    year < 1900 ||
    year > 2100 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return { error: `${field} must be a valid date.` };
  }

  return { value: normalized };
}

function decimalValue(value, options) {
  const {
    field,
    min,
    max,
    required = true,
    decimalPlaces = 2,
  } = options;

  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && !value.trim())
  ) {
    return required
      ? { error: `${field} is required.` }
      : { value: null };
  }

  const text = String(value).trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    return {
      error: `${field} must be a number with no more than ${decimalPlaces} decimal places.`,
    };
  }

  const number = Number(text);

  if (!Number.isFinite(number) || number < min || number > max) {
    return {
      error: `${field} must be between ${min} and ${max}.`,
    };
  }

  return { value: number.toFixed(decimalPlaces) };
}

function normalizeWriters(value) {
  if (Array.isArray(value)) {
    value = value
      .filter((writer) => typeof writer === 'string')
      .map((writer) => writer.trim())
      .filter(Boolean)
      .join(', ');
  }

  return boundedText(value, {
    required: true,
    max: 2000,
    field: 'Writers',
  });
}

function assignResult(fields, key, result) {
  if (result.error) {
    fields[key] = result.error;
    return null;
  }

  return result.value;
}

function normalizeIsrc(value) {
  const result = boundedText(value, {
    required: false,
    max: 20,
    field: 'ISRC',
  });

  if (result.error || result.value === null) {
    return result;
  }

  const normalized = result.value.toUpperCase().replace(/[\s-]/g, '');

  if (!ISRC_PATTERN.test(normalized)) {
    return { error: 'ISRC must contain a valid 12-character code.' };
  }

  return { value: normalized };
}

function normalizeUpc(value) {
  const result = boundedText(value, {
    required: false,
    max: 20,
    field: 'UPC',
  });

  if (result.error || result.value === null) {
    return result;
  }

  const normalized = result.value.replace(/[\s-]/g, '');

  if (!UPC_PATTERN.test(normalized)) {
    return { error: 'UPC must contain 12 or 13 digits.' };
  }

  return { value: normalized };
}

function mapRelease(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    artistName: row.artist,
    releaseType: row.releaseType,
    releaseDate: row.releaseDate,
    genre: row.genre,
    label: row.label,
    upc: row.upc,
    status: row.status,
    primaryTrack: row.primaryTrack,
    isrc: row.isrc,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapWork(row) {
  const ownershipShare = Number(row.ownershipShare);

  return {
    id: row.id,
    title: row.title,
    workTitle: row.title,
    alternateTitle: row.alternateTitle,
    writers: row.writers,
    ownershipShare: Number.isFinite(ownershipShare) ? ownershipShare : 0,
    performingRightsOrganization: row.performingRightsOrganization,
    pro: row.performingRightsOrganization,
    ipiNumber: row.ipiNumber,
    registrationStatus: row.registrationStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapCampaign(row) {
  const budget = Number(row.budget);

  return {
    id: row.id,
    name: row.name,
    campaignName: row.name,
    release: row.release,
    releaseTitle: row.release,
    objective: row.objective,
    channel: row.channel,
    budget: Number.isFinite(budget) ? budget : 0,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const RELEASE_SELECT = `
  SELECT
    r.id,
    r.title,
    r.artist_name AS artist,
    r.release_type AS releaseType,
    DATE_FORMAT(r.release_date, '%Y-%m-%d') AS releaseDate,
    r.genre,
    r.label,
    r.upc,
    r.status,
    t.title AS primaryTrack,
    t.isrc,
    r.created_at AS createdAt,
    r.updated_at AS updatedAt
  FROM distribution_releases r
  LEFT JOIN release_tracks t
    ON t.release_id = r.id
    AND t.track_number = 1
`;

const WORK_SELECT = `
  SELECT
    w.id,
    w.work_title AS title,
    w.alternate_title AS alternateTitle,
    w.writers,
    w.ownership_share AS ownershipShare,
    w.performing_rights_organization AS performingRightsOrganization,
    w.ipi_number AS ipiNumber,
    w.registration_status AS registrationStatus,
    w.created_at AS createdAt,
    w.updated_at AS updatedAt
  FROM publishing_works w
`;

const CAMPAIGN_SELECT = `
  SELECT
    c.id,
    c.campaign_name AS name,
    c.release_title AS \`release\`,
    c.objective,
    c.channel,
    c.budget,
    DATE_FORMAT(c.start_date, '%Y-%m-%d') AS startDate,
    DATE_FORMAT(c.end_date, '%Y-%m-%d') AS endDate,
    c.status,
    c.created_at AS createdAt,
    c.updated_at AS updatedAt
  FROM marketing_campaigns c
`;

async function getDashboard(req, res) {
  const userId = req.session.userId;

  const [countRows] = await pool.execute(
    `
      SELECT
        (SELECT COUNT(*) FROM distribution_releases WHERE user_id = ?) AS releases,
        (SELECT COUNT(*) FROM publishing_works WHERE user_id = ?) AS works,
        (SELECT COUNT(*) FROM marketing_campaigns WHERE user_id = ?) AS campaigns
    `,
    [userId, userId, userId]
  );

  const [releaseRows, workRows, campaignRows] = await Promise.all([
    pool.execute(
      `${RELEASE_SELECT}
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT 5`,
      [userId]
    ),
    pool.execute(
      `${WORK_SELECT}
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC, w.id DESC
       LIMIT 5`,
      [userId]
    ),
    pool.execute(
      `${CAMPAIGN_SELECT}
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT 5`,
      [userId]
    ),
  ]);

  const counts = countRows[0] || {};
  const releases = releaseRows[0].map(mapRelease);
  const works = workRows[0].map(mapWork);
  const campaigns = campaignRows[0].map(mapCampaign);

  return res.json({
    summary: {
      releases: Number(counts.releases) || 0,
      works: Number(counts.works) || 0,
      campaigns: Number(counts.campaigns) || 0,
    },
    recent: {
      releases,
      works,
      campaigns,
    },
  });
}

async function listReleases(req, res) {
  const [rows] = await pool.execute(
    `${RELEASE_SELECT}
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC, r.id DESC`,
    [req.session.userId]
  );

  return res.json({ releases: rows.map(mapRelease) });
}

async function createRelease(req, res) {
  const body = req.body || {};
  const fields = {};

  const title = assignResult(
    fields,
    'title',
    boundedText(body.title, {
      required: true,
      max: 200,
      field: 'Title',
    })
  );
  const artist = assignResult(
    fields,
    'artist',
    boundedText(body.artist ?? body.artistName, {
      required: true,
      max: 150,
      field: 'Artist',
    })
  );
  const releaseType = assignResult(
    fields,
    'releaseType',
    enumValue(body.releaseType, RELEASE_TYPES, 'Release type')
  );
  const releaseDate = assignResult(
    fields,
    'releaseDate',
    isoDate(body.releaseDate, 'Release date')
  );
  const genre = assignResult(
    fields,
    'genre',
    boundedText(body.genre, {
      required: false,
      max: 80,
      field: 'Genre',
    })
  );
  const label = assignResult(
    fields,
    'label',
    boundedText(body.label, {
      required: false,
      max: 150,
      field: 'Label',
    })
  );
  const primaryTrack = assignResult(
    fields,
    'primaryTrack',
    boundedText(body.primaryTrack, {
      required: true,
      max: 200,
      field: 'Primary track',
    })
  );
  const isrc = assignResult(fields, 'isrc', normalizeIsrc(body.isrc));
  const upc = assignResult(fields, 'upc', normalizeUpc(body.upc));

  if (Object.keys(fields).length > 0) {
    return validationError(res, fields);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [releaseResult] = await connection.execute(
      `
        INSERT INTO distribution_releases
          (user_id, title, artist_name, release_type, release_date, genre, label, upc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.session.userId,
        title,
        artist,
        releaseType,
        releaseDate,
        genre,
        label,
        upc,
      ]
    );

    await connection.execute(
      `
        INSERT INTO release_tracks
          (release_id, title, isrc, track_number)
        VALUES (?, ?, ?, 1)
      `,
      [releaseResult.insertId, primaryTrack, isrc]
    );

    const [rows] = await connection.execute(
      `${RELEASE_SELECT}
       WHERE r.id = ? AND r.user_id = ?
       LIMIT 1`,
      [releaseResult.insertId, req.session.userId]
    );

    await connection.commit();

    return res.status(201).json({
      release: mapRelease(rows[0]),
      message: 'Release created successfully.',
    });
  } catch (error) {
    await connection.rollback();

    if (error && error.code === 'ER_DUP_ENTRY') {
      const duplicateFields = {};
      const message = String(error.message || '').toLowerCase();

      if (message.includes('isrc')) {
        duplicateFields.isrc = 'This ISRC is already registered.';
      } else if (message.includes('upc')) {
        duplicateFields.upc = 'This UPC is already registered.';
      } else {
        duplicateFields.release = 'A release with these identifiers already exists.';
      }

      return validationError(
        res,
        duplicateFields,
        'A release with this identifier already exists.'
      );
    }

    throw error;
  } finally {
    connection.release();
  }
}

async function listWorks(req, res) {
  const [rows] = await pool.execute(
    `${WORK_SELECT}
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC, w.id DESC`,
    [req.session.userId]
  );

  return res.json({ works: rows.map(mapWork) });
}

async function createWork(req, res) {
  const body = req.body || {};
  const fields = {};

  const title = assignResult(
    fields,
    'title',
    boundedText(body.title ?? body.workTitle, {
      required: true,
      max: 200,
      field: 'Work title',
    })
  );
  const alternateTitle = assignResult(
    fields,
    'alternateTitle',
    boundedText(body.alternateTitle, {
      required: false,
      max: 200,
      field: 'Alternate title',
    })
  );
  const writers = assignResult(fields, 'writers', normalizeWriters(body.writers));
  const ownershipShare = assignResult(
    fields,
    'ownershipShare',
    decimalValue(body.ownershipShare, {
      field: 'Ownership share',
      min: 0.01,
      max: 100,
      decimalPlaces: 2,
    })
  );
  const performingRightsOrganization = assignResult(
    fields,
    'performingRightsOrganization',
    boundedText(
      body.performingRightsOrganization ?? body.pro,
      {
        required: true,
        max: 100,
        field: 'Performing-rights organization',
      }
    )
  );
  const ipiNumber = assignResult(
    fields,
    'ipiNumber',
    boundedText(body.ipiNumber, {
      required: false,
      max: 30,
      field: 'IPI number',
    })
  );
  const registrationStatus = assignResult(
    fields,
    'registrationStatus',
    enumValue(
      body.registrationStatus,
      WORK_STATUSES,
      'Registration status'
    )
  );

  if (Object.keys(fields).length > 0) {
    return validationError(res, fields);
  }

  try {
    const [result] = await pool.execute(
      `
        INSERT INTO publishing_works
          (
            user_id,
            work_title,
            alternate_title,
            writers,
            ownership_share,
            performing_rights_organization,
            ipi_number,
            registration_status
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.session.userId,
        title,
        alternateTitle,
        writers,
        ownershipShare,
        performingRightsOrganization,
        ipiNumber,
        registrationStatus,
      ]
    );

    const [rows] = await pool.execute(
      `${WORK_SELECT}
       WHERE w.id = ? AND w.user_id = ?
       LIMIT 1`,
      [result.insertId, req.session.userId]
    );

    return res.status(201).json({
      work: mapWork(rows[0]),
      message: 'Publishing work created successfully.',
    });
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return validationError(
        res,
        {
          ipiNumber: 'A work with this registration identifier already exists.',
        },
        'This publishing work is already registered.'
      );
    }

    throw error;
  }
}

async function listCampaigns(req, res) {
  const [rows] = await pool.execute(
    `${CAMPAIGN_SELECT}
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC, c.id DESC`,
    [req.session.userId]
  );

  return res.json({ campaigns: rows.map(mapCampaign) });
}

async function createCampaign(req, res) {
  const body = req.body || {};
  const fields = {};

  const name = assignResult(
    fields,
    'name',
    boundedText(body.name ?? body.campaignName, {
      required: true,
      max: 200,
      field: 'Campaign name',
    })
  );
  const release = assignResult(
    fields,
    'release',
    boundedText(body.release ?? body.releaseTitle, {
      required: true,
      max: 200,
      field: 'Release',
    })
  );
  const objective = assignResult(
    fields,
    'objective',
    enumValue(body.objective, CAMPAIGN_OBJECTIVES, 'Objective')
  );
  const channel = assignResult(
    fields,
    'channel',
    enumValue(body.channel, CAMPAIGN_CHANNELS, 'Channel')
  );
  const budget = assignResult(
    fields,
    'budget',
    decimalValue(body.budget, {
      field: 'Budget',
      min: 0,
      max: 10000000,
      decimalPlaces: 2,
    })
  );
  const startDate = assignResult(
    fields,
    'startDate',
    isoDate(body.startDate, 'Start date')
  );
  const endDate = assignResult(
    fields,
    'endDate',
    isoDate(body.endDate, 'End date')
  );

  if (
    startDate &&
    endDate &&
    !fields.startDate &&
    !fields.endDate &&
    endDate < startDate
  ) {
    fields.endDate = 'End date must be on or after the start date.';
  }

  if (Object.keys(fields).length > 0) {
    return validationError(res, fields);
  }

  const [result] = await pool.execute(
    `
      INSERT INTO marketing_campaigns
        (
          user_id,
          campaign_name,
          release_title,
          objective,
          channel,
          budget,
          start_date,
          end_date
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      req.session.userId,
      name,
      release,
      objective,
      channel,
      budget,
      startDate,
      endDate,
    ]
  );

  const [rows] = await pool.execute(
    `${CAMPAIGN_SELECT}
     WHERE c.id = ? AND c.user_id = ?
     LIMIT 1`,
    [result.insertId, req.session.userId]
  );

  return res.status(201).json({
    campaign: mapCampaign(rows[0]),
    message: 'Campaign created successfully.',
  });
}

module.exports = {
  getDashboard,
  listReleases,
  createRelease,
  listWorks,
  createWork,
  listCampaigns,
  createCampaign,
};