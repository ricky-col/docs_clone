import Document from '../models/Document.js';
import User from '../models/User.js';
import Version from '../models/Version.js';

// @desc    Get user's documents (owned or collaborating)
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    })
      .populate('owner', 'name email')
      .populate('collaborators', 'name email')
      .sort({ updatedAt: -1 });

    res.json(docs);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new document
// @route   POST /api/documents
// @access  Private
export const createDocument = async (req, res, next) => {
  try {
    const doc = await Document.create({
      title: req.body.title || 'Untitled Document',
      content: '', // Initial empty Yjs state
      owner: req.user._id,
      collaborators: [],
    });

    const populatedDoc = await Document.findById(doc._id).populate('owner', 'name email');
    res.status(201).json(populatedDoc);
  } catch (error) {
    next(error);
  }
};

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Private
export const getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators', 'name email');

    if (!doc) {
      res.status(404);
      throw new Error('Document not found');
    }

    // Check authorization
    const isOwner = doc.owner._id.toString() === req.user._id.toString();
    const isCollaborator = doc.collaborators.some(
      (c) => c._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator) {
      res.status(403);
      throw new Error('Access denied to this document');
    }

    res.json(doc);
  } catch (error) {
    next(error);
  }
};

// @desc    Update document metadata (title)
// @route   PUT /api/documents/:id
// @access  Private
export const updateDocument = async (req, res, next) => {
  const { title } = req.body;
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      res.status(404);
      throw new Error('Document not found');
    }

    // Auth check
    const isOwner = doc.owner.toString() === req.user._id.toString();
    const isCollaborator = doc.collaborators.some(c => c.toString() === req.user._id.toString());

    if (!isOwner && !isCollaborator) {
      res.status(403);
      throw new Error('Access denied');
    }

    if (title !== undefined) doc.title = title;
    await doc.save();

    const updatedDoc = await Document.findById(doc._id)
      .populate('owner', 'name email')
      .populate('collaborators', 'name email');

    res.json(updatedDoc);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Owner Only)
export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      res.status(404);
      throw new Error('Document not found');
    }

    // Only owner can delete
    if (doc.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the document owner can delete this document');
    }

    await Document.deleteOne({ _id: doc._id });
    // Clean up versions
    await Version.deleteMany({ documentId: doc._id });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate document
// @route   POST /api/documents/:id/duplicate
// @access  Private
export const duplicateDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      res.status(404);
      throw new Error('Document not found');
    }

    const isOwner = doc.owner.toString() === req.user._id.toString();
    const isCollaborator = doc.collaborators.some(c => c.toString() === req.user._id.toString());

    if (!isOwner && !isCollaborator) {
      res.status(403);
      throw new Error('Access denied');
    }

    const duplicatedDoc = await Document.create({
      title: `Copy of ${doc.title}`,
      content: doc.content,
      owner: req.user._id,
      collaborators: [],
    });

    const populatedDoc = await Document.findById(duplicatedDoc._id).populate('owner', 'name email');
    res.status(201).json(populatedDoc);
  } catch (error) {
    next(error);
  }
};

// @desc    Share document by adding a collaborator email
// @route   POST /api/documents/:id/share
// @access  Private (Owner Only)
export const shareDocument = async (req, res, next) => {
  const { email } = req.body;
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      res.status(404);
      throw new Error('Document not found');
    }

    if (doc.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the owner can share this document');
    }

    const userToShare = await User.findOne({ email });
    if (!userToShare) {
      res.status(404);
      throw new Error('User with this email not found');
    }

    if (userToShare._id.toString() === doc.owner.toString()) {
      res.status(400);
      throw new Error('You cannot share the document with yourself (owner)');
    }

    if (doc.collaborators.some(c => c.toString() === userToShare._id.toString())) {
      res.status(400);
      throw new Error('User is already a collaborator');
    }

    doc.collaborators.push(userToShare._id);
    await doc.save();

    const updatedDoc = await Document.findById(doc._id)
      .populate('owner', 'name email')
      .populate('collaborators', 'name email');

    res.json(updatedDoc);
  } catch (error) {
    next(error);
  }
};

// @desc    Join document via invite link token
// @route   POST /api/documents/:id/join/:token
// @access  Private
export const joinViaInvite = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      res.status(404);
      throw new Error('Document not found');
    }

    if (doc.inviteToken !== req.params.token) {
      res.status(400);
      throw new Error('Invalid or expired invite link');
    }

    // Check if already a collaborator or owner
    const isOwner = doc.owner.toString() === req.user._id.toString();
    const isCollaborator = doc.collaborators.some(c => c.toString() === req.user._id.toString());

    if (isOwner || isCollaborator) {
      return res.json({ message: 'Already a collaborator', documentId: doc._id });
    }

    doc.collaborators.push(req.user._id);
    await doc.save();

    res.json({ message: 'Successfully joined document', documentId: doc._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Get document versions
// @route   GET /api/documents/:id/versions
// @access  Private
export const getDocumentVersions = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      res.status(404);
      throw new Error('Document not found');
    }

    const isOwner = doc.owner.toString() === req.user._id.toString();
    const isCollaborator = doc.collaborators.some(c => c.toString() === req.user._id.toString());

    if (!isOwner && !isCollaborator) {
      res.status(403);
      throw new Error('Access denied');
    }

    const versions = await Version.find({ documentId: doc._id })
      .populate('editedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(versions);
  } catch (error) {
    next(error);
  }
};

// @desc    Restore a version
// @route   POST /api/documents/:id/versions/:versionId/restore
// @access  Private
export const restoreDocumentVersion = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      res.status(404);
      throw new Error('Document not found');
    }

    const isOwner = doc.owner.toString() === req.user._id.toString();
    const isCollaborator = doc.collaborators.some(c => c.toString() === req.user._id.toString());

    if (!isOwner && !isCollaborator) {
      res.status(403);
      throw new Error('Access denied');
    }

    const version = await Version.findById(req.params.versionId);
    if (!version || version.documentId.toString() !== doc._id.toString()) {
      res.status(404);
      throw new Error('Version not found for this document');
    }

    // Save current content snapshot as a version first
    await Version.create({
      documentId: doc._id,
      contentSnapshot: doc.content,
      editedBy: req.user._id,
    });

    // Update document content to target version snapshot
    doc.content = version.contentSnapshot;
    await doc.save();

    res.json({ message: 'Version restored successfully', content: doc.content });
  } catch (error) {
    next(error);
  }
};
