import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionRouter from "./session";
import schoolRouter from "./school";
import teachersRouter from "./teachers";
import taxonomyRouter from "./taxonomy";
import questionsRouter from "./questions";
import papersRouter from "./papers";
import packagesRouter from "./packages";
import adminRouter from "./admin";
import statsRouter from "./stats";
import viewsRouter from "./views";
import billingRouter from "./billing";
import templatesRouter from "./templates";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionRouter);
router.use(schoolRouter);
router.use(teachersRouter);
router.use(taxonomyRouter);
router.use(questionsRouter);
router.use(papersRouter);
router.use(packagesRouter);
router.use(adminRouter);
router.use(statsRouter);
router.use(viewsRouter);
router.use(billingRouter);
router.use(templatesRouter);

export default router;
