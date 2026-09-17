import { Router } from 'express';
import * as controller from "./controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
router.get('/', controller.getAll);
router.post('/', controller.create);
router.patch('/:id/read', controller.markRead);

export default router;