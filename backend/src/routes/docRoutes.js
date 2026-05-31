import express from 'express';
import {
  getDocuments,
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  duplicateDocument,
  shareDocument,
  joinViaInvite,
  getDocumentVersions,
  restoreDocumentVersion,
} from '../controllers/docController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.route('/')
  .get(getDocuments)
  .post(createDocument);

router.route('/:id')
  .get(getDocumentById)
  .put(updateDocument)
  .delete(deleteDocument);

router.post('/:id/duplicate', duplicateDocument);
router.post('/:id/share', shareDocument);
router.post('/:id/join/:token', joinViaInvite);

router.get('/:id/versions', getDocumentVersions);
router.post('/:id/versions/:versionId/restore', restoreDocumentVersion);

export default router;
