import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../utils/auth.js';
import { z } from 'zod';
import crypto from 'crypto';

const router = express.Router();

const createShareLinkSchema = z.object({
  householdId: z.string(),
  expiresInDays: z.number().int().positive().optional(),
});

// Create shareable link (authenticated users only)
router.post('/', authenticate, async (req, res) => {
  try {
    const data = createShareLinkSchema.parse(req.body);
    const userId = req.user!.userId;

    // Verify user is member
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId: data.householdId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Deactivate existing shares
    await prisma.mealPlanShare.updateMany({
      where: {
        householdId: data.householdId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Generate share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const shareLink = await prisma.mealPlanShare.create({
      data: {
        householdId: data.householdId,
        shareToken,
        isActive: true,
        expiresAt,
      },
    });

    res.status(201).json({
      shareToken: shareLink.shareToken,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${shareLink.shareToken}`,
      expiresAt: shareLink.expiresAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create share link error:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// Get meal plan via share token (public, no auth required)
router.get('/:token', async (req, res) => {
  try {
    const token = req.params.token;

    const shareLink = await prisma.mealPlanShare.findUnique({
      where: { shareToken: token },
      include: {
        household: {
          include: {
            meals: {
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                recipe: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                date: 'asc',
              },
            },
          },
        },
      },
    });

    if (!shareLink) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    if (!shareLink.isActive) {
      return res.status(410).json({ error: 'Share link has been deactivated' });
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Share link has expired' });
    }

    res.json({
      household: {
        id: shareLink.household.id,
        name: shareLink.household.name,
      },
      meals: shareLink.household.meals,
    });
  } catch (error) {
    console.error('Get shared meal plan error:', error);
    res.status(500).json({ error: 'Failed to fetch shared meal plan' });
  }
});

// Deactivate share link
router.delete('/:token', authenticate, async (req, res) => {
  try {
    const token = req.params.token;
    const userId = req.user!.userId;

    const shareLink = await prisma.mealPlanShare.findUnique({
      where: { shareToken: token },
    });

    if (!shareLink) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId: shareLink.householdId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.mealPlanShare.update({
      where: { shareToken: token },
      data: { isActive: false },
    });

    res.json({ message: 'Share link deactivated' });
  } catch (error) {
    console.error('Deactivate share link error:', error);
    res.status(500).json({ error: 'Failed to deactivate share link' });
  }
});

export default router;




