import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../utils/auth.js';
import { emitToHousehold } from '../utils/socket.js';
import { Server } from 'socket.io';
import { z } from 'zod';
import crypto from 'crypto';

const router = express.Router();

// Get io instance (will be set by index.ts)
let io: Server | null = null;
export const setSocketIO = (socketIO: Server) => {
  io = socketIO;
};

const createHouseholdSchema = z.object({
  name: z.string().min(1),
});

const joinHouseholdSchema = z.object({
  inviteCode: z.string().min(1),
});

// Create new household
router.post('/', authenticate, async (req, res) => {
  try {
    const data = createHouseholdSchema.parse(req.body);
    const userId = req.user!.userId;

    // Generate unique invite code
    const inviteCode = crypto.randomBytes(8).toString('hex');

    // Create household
    const household = await prisma.household.create({
      data: {
        name: data.name,
        inviteCode,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(household);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create household error:', error);
    res.status(500).json({ error: 'Failed to create household' });
  }
});

// Get user's households
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const households = await prisma.household.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            meals: true,
          },
        },
      },
    });

    res.json(households);
  } catch (error) {
    console.error('Get households error:', error);
    res.status(500).json({ error: 'Failed to fetch households' });
  }
});

// Get household by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const householdId = req.params.id;
    const userId = req.user!.userId;

    // Verify user is member
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json(household);
  } catch (error) {
    console.error('Get household error:', error);
    res.status(500).json({ error: 'Failed to fetch household' });
  }
});

// Join household via invite code
router.post('/join', authenticate, async (req, res) => {
  try {
    const data = joinHouseholdSchema.parse(req.body);
    const userId = req.user!.userId;

    // Find household by invite code
    const household = await prisma.household.findUnique({
      where: { inviteCode: data.inviteCode },
    });

    if (!household) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if already a member
    const existingMember = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId: household.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this household' });
    }

    // Add member
    await prisma.householdMember.create({
      data: {
        userId,
        householdId: household.id,
        role: 'member',
      },
    });

    // Emit real-time update
    if (io) {
      emitToHousehold(io, household.id, 'member-joined', { userId });
    }

    const updatedHousehold = await prisma.household.findUnique({
      where: { id: household.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.json(updatedHousehold);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Join household error:', error);
    res.status(500).json({ error: 'Failed to join household' });
  }
});

// Leave household
router.delete('/:id/leave', authenticate, async (req, res) => {
  try {
    const householdId = req.params.id;
    const userId = req.user!.userId;

    // Check if member
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this household' });
    }

    // Don't allow owner to leave if they're the only member
    if (membership.role === 'owner') {
      const memberCount = await prisma.householdMember.count({
        where: { householdId },
      });
      if (memberCount === 1) {
        // Delete household if owner is only member
        await prisma.household.delete({
          where: { id: householdId },
        });
        return res.json({ message: 'Household deleted' });
      }
    }

    // Remove member
    await prisma.householdMember.delete({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    });

    // Emit real-time update
    if (io) {
      emitToHousehold(io, householdId, 'member-left', { userId });
    }

    res.json({ message: 'Left household successfully' });
  } catch (error) {
    console.error('Leave household error:', error);
    res.status(500).json({ error: 'Failed to leave household' });
  }
});

export default router;




