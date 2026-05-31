import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    contentSnapshot: {
      type: String,
      required: true, // The serialized base64 string of the Yjs document state
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Version = mongoose.model('Version', versionSchema);
export default Version;
