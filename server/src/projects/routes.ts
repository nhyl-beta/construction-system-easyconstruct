import { Router } from 'express';
import * as controller from "./controller.js";
import { validate }    from "../middleware/validate.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project-validators.js";

const router = Router();

router.get ('/',    controller.getAll);
router.post('/',    validate(createProjectSchema), controller.create);
router.get ('/:id', controller.getById);
router.patch('/:id',validate(updateProjectSchema), controller.update);
router.delete('/:id',controller.remove);

export default router;