import { Router } from 'express';
import * as controller from "./controller.js";

const router = Router();
router.get('/', controller.getAll);
router.post('/', controller.create);
router.patch('/:id/read', controller.markRead);

export default router;