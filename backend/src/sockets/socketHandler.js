import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Version from '../models/Version.js';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret_123';

// Memory cache for active rooms and their occupants
const activeRooms = {}; // { documentId: { socketId: { userId, name, email, cursor, isTyping } } }

// Helper for debounced auto-saves to prevent DB overload
const saveTimeouts = {};

const debounceSave = (docId, updateFn) => {
  if (saveTimeouts[docId]) {
    clearTimeout(saveTimeouts[docId]);
  }
  saveTimeouts[docId] = setTimeout(async () => {
    try {
      await updateFn();
      delete saveTimeouts[docId];
    } catch (err) {
      console.error(`Failed to auto-save document ${docId}:`, err);
    }
  }, 3000); // 3-second debounce window
};

export const socketConfig = (io) => {
  // Middleware to authenticate socket connections with JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const secret = process.env.ACCESS_TOKEN_SECRET || 'access_secret_123';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket Connected: User ${socket.user.name} (${socket.id})`);

    // 1. JOIN DOCUMENT ROOM
    socket.on('document:join', async ({ documentId }) => {
      socket.join(documentId);
      socket.currentDocId = documentId;

      // Add user to the active room cache
      if (!activeRooms[documentId]) {
        activeRooms[documentId] = {};
      }

      activeRooms[documentId][socket.id] = {
        userId: socket.user._id,
        name: socket.user.name,
        email: socket.user.email,
        cursor: null,
        isTyping: false,
      };

      try {
        const doc = await Document.findById(documentId);
        if (doc) {
          // Load existing content (base64 serialized Yjs update) and send to client
          socket.emit('document:load', { content: doc.content });
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to load document' });
      }

      // Broadcast updated collaborator list to the room
      io.to(documentId).emit('user:joined', {
        collaborators: Object.values(activeRooms[documentId]),
      });
    });

    // 2. DOCUMENT SYNC UPDATE (Live Deltas)
    socket.on('document:update', ({ documentId, update }) => {
      // Broadcast the update to all other users in the room
      socket.to(documentId).emit('document:updated', { update });
    });

    // Auto-save FULL state to DB
    socket.on('document:autosave', ({ documentId, content }) => {
      debounceSave(documentId, async () => {
        await Document.findByIdAndUpdate(documentId, { content });
      });
    });

    // 3. CURSOR & TYPING INDICATORS
    socket.on('cursor:update', ({ documentId, range, isTyping }) => {
      if (activeRooms[documentId]?.[socket.id]) {
        activeRooms[documentId][socket.id].cursor = range;
        activeRooms[documentId][socket.id].isTyping = isTyping;

        // Broadcast cursor movement to all other users
        socket.to(documentId).emit('cursor:moved', {
          socketId: socket.id,
          userId: socket.user._id,
          name: socket.user.name,
          cursor: range,
          isTyping,
        });
      }
    });

    // 4. MANUAL / TIMED SNAPSHOT SAVE (VERSION CONTROL)
    socket.on('save:document', async ({ documentId, content }) => {
      try {
        // Save standard doc content
        await Document.findByIdAndUpdate(documentId, { content });

        // Generate version snapshot
        await Version.create({
          documentId,
          contentSnapshot: content,
          editedBy: socket.user._id,
        });

        // Broadcast notification to save room that version was created
        io.to(documentId).emit('version:created', { message: 'Version snapshot saved.' });
      } catch (err) {
        console.error('Failed to create version:', err);
      }
    });

    // 5. LEAVE / DISCONNECT HANDLERS
    const handleLeave = () => {
      const docId = socket.currentDocId;
      if (docId && activeRooms[docId]) {
        delete activeRooms[docId][socket.id];

        if (Object.keys(activeRooms[docId]).length === 0) {
          delete activeRooms[docId];
        } else {
          io.to(docId).emit('user:left', {
            socketId: socket.id,
            collaborators: Object.values(activeRooms[docId]),
          });
        }
      }
    };

    socket.on('document:leave', () => {
      handleLeave();
      if (socket.currentDocId) {
        socket.leave(socket.currentDocId);
        socket.currentDocId = null;
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket Disconnected: User ${socket.user.name} (${socket.id})`);
      handleLeave();
    });
  });
};
