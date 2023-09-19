const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { addFeaturesValidation, push_Notification, addSchoolWorkShopTenStepsValidation, subcategoryMediaValidation, chapterIdValidation, addJobDescriptionDetailsValidation, subcategoryIdValidation, addWorkShopTenStepsValidation, updateWorkShopTenStepsValidation, WorkShopTenStepsValidation, fileValidation, addExamPaperValidation, examPaperValidation, dailyPostValidation, createNewAssessmentValidation, addQuestionWithOptionsValidation, updateQuestionWithOptionsValidation } = require('../helpers/validator');
const verifyToken = require('../middlewares/auth.middleware');
const dashboard = require('../controllers/admin.dashboard');
const { upload, assist } = require('../middlewares/upload.js');

// R - Dashboard
router.get("/dashboard", verifyToken, adminController.dashboard);

// CRUD - Features and benifits
router.post("/features-and-benefits-add", [verifyToken, addFeaturesValidation, upload.single('file')], adminController.addFeaturesAndBenefits);
router.get("/features-and-benefits-list", [verifyToken], adminController.featuresAndBenefitsList);
router.put("/features-and-benefits-update", [verifyToken, addFeaturesValidation, upload.single('file')], adminController.updateFeaturesAndBenefits);
router.delete("/features-and-benefits-delete", [verifyToken], adminController.deleteFeaturesAndBenifits);
router.get("/features-and-benefits-edit", [verifyToken], adminController.featuresAndBenefitsEdit);

// CRUD - School Workshop in 10 steps
router.post("/school-work-shop-ten-steps-add", [verifyToken, addSchoolWorkShopTenStepsValidation], (req, res, next) => next(), adminController.SchoolWorkShopTenStepsAdd);
router.get("/school-work-shop-ten-steps-list", [verifyToken], (req, res, next) => next(), adminController.SchoolWorkShopTenStepsList);
router.get("/school-work-shop-ten-steps-edit", [verifyToken], (req, res, next) => next(), adminController.SchoolWorkShopTenStepsEdit);
router.put("/school-work-shop-ten-steps-update", [verifyToken, chapterIdValidation, addSchoolWorkShopTenStepsValidation], (req, res, next) => next(), adminController.SchoolWorkShopTenStepsUpdate);
router.delete("/school-work-shop-ten-steps-delete", [verifyToken], (req, res, next) => next(), adminController.SchoolWorkShopTenStepsDelete);
router.get("/school-work-shop-ten-steps-read", [verifyToken], (req, res, next) => next(), adminController.SchoolWorkShopTenStepsRead);

// READ - Job description
router.get("/job-description-list", [verifyToken], adminController.getJobDescriptionList);

// CRUD - Job description Details
router.post("/job-description-details-add", [verifyToken, addJobDescriptionDetailsValidation], adminController.addJobDescriptionDetails);
router.get("/job-description-details-edit", [verifyToken], adminController.editJobDescriptionDetails);
router.get("/job-description-details-list", [verifyToken], adminController.getJobDescriptionDetailsList);
router.put("/job-description-details-update", [verifyToken, addJobDescriptionDetailsValidation], adminController.updateJobDescriptionDetails);
router.delete("/job-description-details-delete", [verifyToken], adminController.deleteJobDescriptionDetails);

//Work Shop ten steps
router.get("/work-shop-ten-steps-list", [verifyToken, subcategoryIdValidation], adminController.WorkShopTenStepsList);
router.post("/work-shop-ten-steps-add", [verifyToken, addWorkShopTenStepsValidation], adminController.WorkShopTenStepsAdd);
router.put("/work-shop-ten-steps-update", [verifyToken, addWorkShopTenStepsValidation, updateWorkShopTenStepsValidation], adminController.WorkShopTenStepsUpdate);
router.delete("/work-shop-ten-steps-delete", [verifyToken, WorkShopTenStepsValidation], adminController.WorkShopTenStepsDelete);
router.get("/work-shop-ten-steps-edit", [verifyToken, WorkShopTenStepsValidation], adminController.editWorkShop);

// READ - Supervision List
router.get("/supervision-list", [verifyToken], adminController.getSupervisionList);

// READ - Month List
router.get("/month-list", [verifyToken], adminController.getMonthList);

// CRUD - Supervision Notes
router.post("/supervision-notes-add", [verifyToken], adminController.addSupervisionNotes);
router.get("/supervision-notes", [verifyToken], adminController.getSupervisionNotes);
router.put("/supervision-notes-update", [verifyToken], adminController.updateSupervisionNotes);
router.delete("/supervision-notes-delete", [verifyToken], adminController.deleteSupervisionNotes);
router.get("/edit-notes", [verifyToken], adminController.editNotes);

//exam paper
router.post("/exam-paper-add", [verifyToken, addExamPaperValidation], adminController.examPaperAdd);
router.get("/exam-paper-list", [verifyToken], adminController.examPaperList);
router.delete("/exam-paper-delete", [verifyToken, examPaperValidation], adminController.examPaperDelete);
router.put("/exam-paper-update", [verifyToken], adminController.examPaperUpdate);
router.delete("/exam-paper-categorie-delete", [verifyToken], adminController.examPaperCategorieDelete);
router.post("/add-exam-paper-categorie", [verifyToken], adminController.addExamPaperCategorie);
router.get("/exam-paper-categorie-list", [verifyToken], adminController.examPaperCategorieList);
router.get("/exam-file-category", [verifyToken], adminController.ExamfileCategorie);
// sub category media
router.get("/get-subcategory-media", [verifyToken, subcategoryIdValidation], adminController.getSubcategoryMedia);
router.put("/subcategory-media-update", [verifyToken, subcategoryIdValidation, subcategoryMediaValidation], adminController.subCategoryMediaUpdate);
router.post("/category-media-add", [verifyToken, subcategoryMediaValidation], adminController.subCategoryMediaAdd);
//list  subcategory
router.get("/get-subcategory-list", [verifyToken], adminController.SubcategoryRead);

// CRUD - Daily Posts
router.post("/daily-post-add", [verifyToken, dailyPostValidation], adminController.addDailyPost);
router.get("/daily-posts", [verifyToken], adminController.dailyPosts);
router.put("/daily-post-update", [verifyToken, dailyPostValidation], adminController.updateDailyPost);
router.delete("/daily-post-delete", [verifyToken], adminController.deleteDailyPosts);
router.get("/daily-post-edit", [verifyToken], adminController.editDailypost);
//dashboard + push nnotification
router.get("/dashb", [verifyToken], dashboard.dashboardGoogleAnalytic)
router.post("/pushb", [verifyToken], dashboard.pushNotification)
//assist 
router.post("/assist-add", [verifyToken, assist.single('file')], adminController.assistOptionAdd)
router.post("/assist-update", [verifyToken], assist.single('file'), adminController.assistOptionUpdate)
router.get("/assist-list", [verifyToken], adminController.assistList)
router.get("/assist-edit", [verifyToken], adminController.editAssist)
router.get("/assist-delete", [verifyToken], adminController.deleteAssist)

//Syllabus details API's
router.post("/syllabus-add", [verifyToken], assist.single('file'), adminController.syllabusAdd)
router.post("/syllabus-update", [verifyToken], assist.single('file'), adminController.syllabusUpdate)
router.get("/syllabus-delete", [verifyToken], adminController.syllabysDelete)
router.get("/syllabus-list", [verifyToken], adminController.syllabusList)
router.get("/syllabus-view", [verifyToken], adminController.syllabusEdit)

//Syllabus details API
router.get("/syllabus-details-list", [verifyToken], adminController.syllabusListDetails);
router.post("/syllabus-details-add", [verifyToken], assist.single('file'), adminController.syllabusAddDetails);
router.post("/syllabus-details-update", [verifyToken], assist.single('file'), adminController.syllabusUpdateDetails);
router.get("/syllabus-details-delete", [verifyToken], adminController.syllabysDeleteDetails);
router.get("/syllabus-details-view", [verifyToken], adminController.syllabusEditDetails);

// Assessment API's
router.post("/create-new-assessment", [verifyToken, createNewAssessmentValidation], adminController.createNewAssessment);
router.get("/edit-assessment-details", [verifyToken], adminController.editAssessmentDetails);
router.put("/update-assessment-details", [verifyToken, createNewAssessmentValidation], adminController.updateAssessmentDetails);
router.get("/get-assessment", [verifyToken], adminController.getAssessment);
router.delete("/delete-assessment", [verifyToken], adminController.deleteAssessment);
// =============================================================================================
router.post("/add-question-options", [verifyToken, addQuestionWithOptionsValidation], adminController.addQuestionWithOptions);
router.get("/edit-question-options", [verifyToken], adminController.editQuestionWithOptions);
router.post("/update-question-options", [verifyToken], adminController.updateQuestionWithOptions);
router.delete("/delete-question-options", [verifyToken], adminController.deleteQuestionWithOptions);

module.exports = router;