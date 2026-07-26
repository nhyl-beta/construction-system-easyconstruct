// routes.ts
import { Router } from 'express';
import * as controller from "./controller.js";
import { validate } from "../middleware/validate.js";
import { createBlueprintSchema, updateBlueprintSchema } from "../validators/blueprint-validator.js";

const router = Router();
router.get('/', controller.getAll);
router.post('/', validate(createBlueprintSchema), controller.create);
router.get('/:id', controller.getById);
router.patch('/:id', validate(updateBlueprintSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;