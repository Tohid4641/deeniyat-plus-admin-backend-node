const UserController = require('../controllers/users.controller');
const verifyToken = require('../middlewares/auth.middleware');

const router = require('express').Router();

router.get("/feature-and-benefits-list", UserController.featureAndBenefitList);
router.get("/sub-category-list-data", UserController.subCategoryData);
router.get("/sub-category-of-sublist-data", UserController.subCategoryDataWithSublist);
router.get("/subcategorie-of-subcategorie-list", UserController.subCategorieOfsubCategorieList);
router.get("/get-job-description-list", UserController.getJobDescriptionList);
router.get("/job-description-detail-list", UserController.JobDescriptionDetailList);
router.get("/supervision-list", UserController.supervisionList);
router.get("/supervision-month-list", UserController.supervisionMonth);
router.get("/supervision-data", UserController.supervisionData);
router.get("/daily-post", UserController.dailyPost);
router.get("/get-by-exam", UserController.getByExam);
router.get("/sub-categorie-media", UserController.subCategoryMedia);
router.get("/get-assessment", UserController.getAssessment);
router.post("/retrieve-token", UserController.addFbaseToken)

router.get("/support-section", UserController.support);
router.get("/support-syllabus", UserController.syllabusCourse);
router.get("/support-syllabus-details", UserController.syllabusDetails);

// router.get("/categories", verifyToken, getCategories);

module.exports = router;