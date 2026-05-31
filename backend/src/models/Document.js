import mongoose from 'mongoose';
import crypto from 'crypto';

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: 'Untitled Document',
      trim: true,
    },
    inviteToken: {
      type: String,
      default: () => crypto.randomUUID(),
    },
    content: {
      type: String,
      default: '', // Stores the serialized base64 state of the Yjs document
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model('Document', documentSchema);
export default Document;
