import { Router, Request, Response } from 'express';
import { requireCustomerAuth, AuthenticatedUserRequest } from '../auth';
import { allUnits, getUnitById } from '../data/units';

export const contentRouter = Router();

/**
 * Public Sample Preview: Unit 1
 * GET /api/content/preview
 * Allows prospective customers to test Unit 1 without logging in.
 */
contentRouter.get('/preview', (_req: Request, res: Response): void => {
  const sampleUnit = allUnits.find(u => u.id === 1);
  if (!sampleUnit) {
    res.status(404).json({ ok: false, error: 'SAMPLE_NOT_FOUND' });
    return;
  }
  res.json({
    ok: true,
    isSample: true,
    unit: sampleUnit,
  });
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
