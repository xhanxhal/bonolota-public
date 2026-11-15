import { Router, Request, Response } from 'express';
import { requireCustomerAuth, AuthenticatedUserRequest } from '../auth';
import { allUnits, getUnitById } from '../data/units';
import { lookupEnglishWord } from '../dictionary';

export const contentRouter = Router();

/**
 * Beginner Mode Dictionary Lookup
 * GET /api/content/word-lookup?word=...&context=...
 * Requires active, verified customer session
 */
contentRouter.get('/word-lookup', requireCustomerAuth, async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
  const rawWord = String(req.query.word || '').trim();
  const context = typeof req.query.context === 'string' ? req.query.context.trim().slice(0, 300) : undefined;

  if (!rawWord || rawWord.length > 60) {
    res.status(400).json({ ok: false, error: 'INVALID_WORD' });
    return;
  }

  try {
    const entry = await lookupEnglishWord(rawWord, context);
    res.json({ ok: true, entry });
  } catch (err) {
    console.error('[WordLookup Error]:', err);
    res.status(500).json({ ok: false, error: 'LOOKUP_FAILED' });
  }
});

/**
 * Protected Content: All 50 Units
 * GET /api/content/units
 * Requires active, verified customer session and unexpired bound license
 */
contentRouter.get('/units', requireCustomerAuth, (req: AuthenticatedUserRequest, res: Response): void => {
  // Return all 50 units with complete vocabulary, mnemonics, exercises, and audio
  res.json({
    ok: true,
    units: allUnits,
    totalUnits: allUnits.length,
    licenseId: req.license?.id,
    expiresAt: req.license?.expiresAt,
  });
});

/**
 * Protected Content: Single Unit by ID
 * GET /api/content/unit/:id
 * Requires active, verified customer session
 */
contentRouter.get('/unit/:id', requireCustomerAuth, (req: AuthenticatedUserRequest, res: Response): void => {
  const unitId = parseInt(req.params.id, 10);
  if (isNaN(unitId)) {
    res.status(400).json({ ok: false, error: 'INVALID_UNIT_ID' });
    return;
  }

  const unit = getUnitById(unitId);
  if (!unit) {
    res.status(404).json({ ok: false, error: 'UNIT_NOT_FOUND' });
    return;
  }

  res.json({
    ok: true,
    unit,
  });
});
