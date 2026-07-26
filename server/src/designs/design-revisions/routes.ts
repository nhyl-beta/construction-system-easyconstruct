// routes.ts
import { Router } from 'express';
import * as controller from "./controller.js";
import { validate } from "../../middleware/validate.js";
import { createDesignRevisionSchema, updateDesignRevisionSchema } from "../../validators/design-revision-validator.js";

const router = Router();
router.get('/', controller.getAll);
router.post('/', validate(createDesignRevisionSchema), controller.create);
router.get('/:id', controller.getById);
router.patch('/:id', validate(updateDesignRevisionSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;