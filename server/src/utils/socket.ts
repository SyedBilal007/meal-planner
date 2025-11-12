import { Server, Socket } from 'socket.io';
import { verifyToken, JWTPayload } from './auth.js';

export const setupSocketIO = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token'));
    }

    try {
      const payload = verifyToken(token);
      socket.data.user = payload;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket & { data: { user: JWTPayload } }) => {
    console.log(`User ${socket.data.user.userId} connected`);

    // Join household room for real-time updates
    socket.on('join-household', (householdId: string) => {
      socket.join(`household:${householdId}`);
      console.log(`User ${socket.data.user.userId} joined household ${householdId}`);
    });

    // Leave household room
    socket.on('leave-household', (householdId: string) => {
      socket.leave(`household:${householdId}`);
      console.log(`User ${socket.data.user.userId} left household ${householdId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.data.user.userId} disconnected`);
    });
  });

  return io;
};

// Helper to emit to household room
export const emitToHousehold = (io: Server, householdId: string, event: string, data: any) => {
  io.to(`household:${householdId}`).emit(event, data);
};

