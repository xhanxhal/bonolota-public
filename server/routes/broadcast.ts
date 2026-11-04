import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAdminAuth, AuthenticatedAdminRequest } from '../auth';
import { BroadcastAnnouncement } from '../types';

export const broadcastRouter = Router();

// Set of active SSE client connections for instant push broadcasting
const sseClients = new Set<Response>();

/**
 * Push an event to all connected active clients
 */
export function pushEventToClients(event: { type: 'announcement' | 'delete' | 'ping'; data?: any }) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Keep-alive heartbeat every 25 seconds
setInterval(() => {
  if (sseClients.size > 0) {
    const ping = ': heartbeat\n\n';
    for (const client of sseClients) {
      try {
        client.write(ping);
      } catch {
        sseClients.delete(client);
      }
    }
  }
}, 25000).unref();

/**
 * Public Client: Stream Real-Time Push Notifications / Announcements (SSE)
 * GET /api/broadcasts/stream
 */
broadcastRouter.get('/stream', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Add to active clients
  sseClients.add(res);

  // Send initial connection event with active announcements
  try {
    const activeList = await storage.listAnnouncements(false);
    res.write(`data: ${JSON.stringify({ type: 'init', announcements: activeList })}\n\n`);
  } catch (err) {
    console.error('[SSE Init Error]:', err);
  }

  req.on('close', () => {
    sseClients.delete(res);
  });
});

/**
 * Public Client: Fetch all active announcements
 * GET /api/broadcasts/active
 */
const handleGetActiveAnnouncements = async (_req: Request, res: Response): Promise<void> => {
  try {
    const announcements = await storage.listAnnouncements(false);
    res.json({ ok: true, announcements });
  } catch (error) {
    console.error('[broadcasts/active] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to fetch announcements.' });
  }
};

broadcastRouter.get('/active', handleGetActiveAnnouncements);
broadcastRouter.get('/', handleGetActiveAnnouncements);

/**
 * Admin: Create and broadcast new announcement
 * POST /api/broadcasts/admin/create OR POST /api/admin/broadcasts
 */
broadcastRouter.post('/admin/create', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { title, message, type, priority, actionUrl, actionText, author, targetKey, displayStyle, autoDismissSeconds } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      res.status(400).json({ ok: false, error: 'INVALID_TITLE', message: 'অ্যানাউন্সমেন্ট এর একটি উপযুক্ত শিরোনাম প্রয়োজন।' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length < 2) {
      res.status(400).json({ ok: false, error: 'INVALID_MESSAGE', message: 'অ্যানাউন্সমেন্ট এর বিস্তারিত বার্তা প্রয়োজন।' });
      return;
    }

    const validTypes = ['info', 'urgent', 'update', 'promotion'] as const;
    const selectedType = validTypes.includes(type) ? type : 'info';
    const selectedPriority = priority === 'high' ? 'high' : 'normal';
    const selectedDisplayStyle = displayStyle === 'toast' ? 'toast' : 'center_modal';
    const parsedAutoDismiss = typeof autoDismissSeconds === 'number' && autoDismissSeconds > 0
      ? autoDismissSeconds
      : (typeof autoDismissSeconds === 'string' && parseInt(autoDismissSeconds, 10) > 0 ? parseInt(autoDismissSeconds, 10) : undefined);
    const cleanTargetKey = typeof targetKey === 'string' && targetKey.trim().length > 0 ? targetKey.trim().toUpperCase() : undefined;

    const newAnnouncement: BroadcastAnnouncement = {
      id: `anno_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      message: message.trim(),
      type: selectedType,
      priority: selectedPriority,
      displayStyle: selectedDisplayStyle,
      targetKey: cleanTargetKey,
      autoDismissSeconds: parsedAutoDismiss,
      actionUrl: typeof actionUrl === 'string' ? actionUrl.trim() : undefined,
      actionText: typeof actionText === 'string' ? actionText.trim() : undefined,
      createdAt: Date.now(),
      active: true,
      author: typeof author === 'string' ? author.trim() : 'Admin',
    };

    // Save persistent
    await storage.createAnnouncement(newAnnouncement);

    // Audit log
    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'create_broadcast',
      details: `Broadcast sent: "${newAnnouncement.title}" [${newAnnouncement.type}|${newAnnouncement.priority}|${selectedDisplayStyle}${cleanTargetKey ? `|Target: ${cleanTargetKey}` : '|Target: ALL'}${parsedAutoDismiss ? `|${parsedAutoDismiss}s` : ''}] to ${sseClients.size} live clients.`,
    });

    // Real-time instant push to all connected browsers
    pushEventToClients({
      type: 'announcement',
      data: newAnnouncement,
    });

    res.json({
      ok: true,
      announcement: newAnnouncement,
      recipientsConnected: sseClients.size,
      message: cleanTargetKey 
        ? `নোটিফিকেশনটি নির্দিষ্ট কি (${cleanTargetKey})-এর জন্য সফলভাবে পাঠানো হয়েছে!`
        : 'অ্যানাউন্সমেন্ট সফলভাবে সকল শিক্ষার্থীর কাছে সম্প্রচার করা হয়েছে!',
    });
  } catch (error) {
    console.error('[broadcasts/admin/create] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'অ্যানাউন্সমেন্ট সম্প্রচার করতে সমস্যা হয়েছে।' });
  }
});

/**
 * Admin: List all announcements (including inactive)
 * GET /api/broadcasts/admin/list
 */
broadcastRouter.get('/admin/list', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const announcements = await storage.listAnnouncements(true);
    res.json({
      ok: true,
      announcements,
      connectedClients: sseClients.size,
    });
  } catch (error) {
    console.error('[broadcasts/admin/list] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'অ্যানাউন্সমেন্ট তালিকা লোড করা যায়নি।' });
  }
});

/**
 * Admin: Delete announcement permanently
 * DELETE /api/broadcasts/admin/:id
 */
broadcastRouter.delete('/admin/:id', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteAnnouncement(id);
    if (!deleted) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'অ্যানাউন্সমেন্ট পাওয়া যায়নি।' });
      return;
    }

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'delete_broadcast',
      details: `Deleted announcement ID: ${id}`,
    });

    // Notify connected clients to remove this announcement
    pushEventToClients({
      type: 'delete',
      data: { id },
    });

    res.json({ ok: true, message: 'অ্যানাউন্সমেন্ট সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error) {
    console.error('[broadcasts/admin/:id] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'অ্যানাউন্সমেন্ট মুছতে সমস্যা হয়েছে।' });
  }
});

/**
 * Admin: Toggle active status
 * PATCH /api/broadcasts/admin/:id/toggle
 */
broadcastRouter.patch('/admin/:id/toggle', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    const updated = await storage.toggleAnnouncement(id, Boolean(active));
    if (!updated) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'অ্যানাউন্সমেন্ট পাওয়া যায়নি।' });
      return;
    }

    if (!updated.active) {
      pushEventToClients({
        type: 'delete',
        data: { id },
      });
    } else {
      pushEventToClients({
        type: 'announcement',
        data: updated,
      });
    }

    res.json({ ok: true, announcement: updated });
  } catch (error) {
    console.error('[broadcasts/admin/:id/toggle] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।' });
  }
});
