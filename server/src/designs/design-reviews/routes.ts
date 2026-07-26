import { Router } from 'express';
import * as controller from "./controller.js";
import { validate } from "../../middleware/validate.js";
import { createDesignReviewSchema, decideDesignReviewSchema } from "../../validators/design-review-validator.js";

const router = Router();
router.get('/', controller.getAll);
router.post('/', validate(createDesignReviewSchema), controller.create);
router.get('/:id', controller.getById);
router.post('/:id/decide', validate(decideDesignReviewSchema), controller.decide);
router.delete('/:id', controller.remove);

export default router;