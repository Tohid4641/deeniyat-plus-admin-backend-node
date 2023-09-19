const { check ,query} = require('express-validator');
 
exports.signupValidation = [
    check('user_name', 'Name is requied').not().isEmpty(),
    check('mail_id', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];
 
exports.loginValidation = [
     check('mail_id', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: true }),
     check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

exports.logoutValidation = [
     check('user_id', 'Please include a current user id for logout').not().isEmpty()
];

exports.addFeaturesValidation = [
     check("urdu_title", "Urdu Title is required").not().isEmpty(),
     check("urdu_desc", "Urdu Description is required").not().isEmpty(),
     check("hindi_title", "Hindi Title is required").not().isEmpty(),
     check("hindi_desc", "Hindi Description is required").not().isEmpty(),
     check("english_title", "English Title is required").not().isEmpty(),
     check("english_desc", "English Description is required").not().isEmpty(),
     check("translitration_title", "Translitration Title is required").not().isEmpty(),
     check("translitration_desc", "Translitration Description is required").not().isEmpty()
];

exports.addSchoolWorkShopTenStepsValidation = [

     check("created_by_id", "Created id is required").not().isEmpty(),

     check("urdu_title", "Urdu Title is required").not().isEmpty(),
     check("school_workshop_ten_step_id", "school workshop ten step id  is required").not().isEmpty(),

     check("urdu_desc", "Urdu Description is required").not().isEmpty(),

     check("school_workshop_ten_step_id", "Hindi Title is required").not().isEmpty(),

     check("hindi_desc", "Hindi Description is required").not().isEmpty(),

     check("english_title", "English Title is required").not().isEmpty(),

     check("english_desc", "English Description is required").not().isEmpty(),

     check("english_lit_title", "Translitration Title is required").not().isEmpty(),
     check("english_lit_desc", "Translitration Title is required").not().isEmpty(),

    

];

exports.chapterIdValidation = [
     check("chapter_id", "Chapter id is required").not().isEmpty(),
];

exports.addJobDescriptionDetailsValidation = [
     check("urdu_title", "Urdu Title is required").not().isEmpty(),
     check("urdu_desc", "Urdu Description is required").not().isEmpty(),
     check("hindi_title", "Hindi Title is required").not().isEmpty(),
     check("hindi_desc", "Hindi Description is required").not().isEmpty(),
     check("english_title", "English Title is required").not().isEmpty(),
     check("english_desc", "English Description is required").not().isEmpty(),
     check("translitration_title", "Translitration Title is required").not().isEmpty(),
     check("translitration_desc", "Translitration Description is required").not().isEmpty()
];
exports.subcategoryIdValidation = [
     query("subcategory_id", "subcategory id is required").not().isEmpty(),
];

exports.addWorkShopTenStepsValidation = [

     check("created_by_id", "created_by_id is required").not().isEmpty(),
     check("step_no_urdu", "step number urdu  is required").not().isEmpty(),
     check("urdu_name", "urdu name id is required").not().isEmpty(),
     check("urdu_duaration", "urdu duaration  is required").not().isEmpty(),
     check("urdu_video_path", "urdu video path is required").not().isEmpty(),
     check("urdu_description", "urdu description  is required").not().isEmpty(),
     check("step_no_english", "step no english is required").not().isEmpty(),
     check("english_name", "english name is required").not().isEmpty(),
     check("english_duaration", "english_ uaration is required").not().isEmpty(),
     check("english_video_path", "english video_path is required").not().isEmpty(),
     check("english_description", "english description is required").not().isEmpty(),
     check("step_no_lit", "step no lit is required").not().isEmpty(),
     check("english_lit_name", "english lit_name is required").not().isEmpty(),
     check("english_lit_duaration", "english lit duaration is required").not().isEmpty(),
     check("english_lit_video_path", "english lit video_path is required").not().isEmpty(),
     check("english_lit_description", "english lit description is required").not().isEmpty(),
     check("step_no_hindi", "step no hindi is required").not().isEmpty(),
     check("hindi_name", "hindi name is required").not().isEmpty(),
     check("hindi_video_path", "hindi video_path is required").not().isEmpty(),
     check("hindi_description", "hindi video path is required").not().isEmpty(),
]
exports.updateWorkShopTenStepsValidation  = [
     check("workshop_ten_step_id", "workshop_ten_step_id is required").not().isEmpty(),
];
exports.WorkShopTenStepsValidation  = [
     query("workshop_ten_step_id", "workshop_ten_step_id is required").not().isEmpty(),
];
exports.addExamPaperValidation = [
     check("year", "year is required").not().isEmpty(),
     check("created_by_id", "Created id is required").not().isEmpty(),
     check("years_link", "years links required").not().isEmpty(),
     check("exam_id", "exam id is required").not().isEmpty(),
     check("years_title_id", "years title id is required").not().isEmpty()
];
exports.examPaperValidation  = [
     query("year_id", "year id is required").not().isEmpty(),
];

exports.subcategoryMediaValidation = [

     check("subcategory_media_VideoName_hindi", "Video Name hindi is required").not().isEmpty(),
     check("subcategory_media_VideoPath_hindi", "Video Path hindi  is required").not().isEmpty(),
     check("subcategory_media_VideoDuaration_hindi", "Video Duaration hindi is required").not().isEmpty(),

     check("subcategory_media_VideoName_urdu", "Video Name urdu  is required").not().isEmpty(),
     check("subcategory_media_VideoPath_urdu", "Video Path urdu is required").not().isEmpty(),
     check("subcategory_media_VideoDuaration_urdu", "Video Duaration urdu  is required").not().isEmpty(),

     check("subcategory_media_VideoName_english", "Video Name english  is required").not().isEmpty(),
     check("subcategory_media_VideoDuaration_hindi", "Video Duaration hindi is required").not().isEmpty(),
     check("subcategory_media_VideoPath_english", "Video Path english is required").not().isEmpty(),
 
     check("subcategory_media_VideoDuaration_lit", "Video Duaration lit is required").not().isEmpty(),
     check("subcategory_media_VideoPath_lit", "VideoPath lit is required").not().isEmpty(),
     check("subcategory_media_VideoName_lit", "Video Name lit duaration is required").not().isEmpty(),

];

exports.dailyPostValidation = [
     check("urdu_message", "Urdu Message is required").not().isEmpty(),
     check("urdu_reference", "Urdu Reference is required").not().isEmpty(),
     check("urdu_date", "Urdu Date is required! or should be valid string Formate(dd-mm-yyyy)").not().isEmpty(),

     check("hindi_message", "Hindi Message is required").not().isEmpty(),
     check("hindi_reference", "Hindi Reference is required").not().isEmpty(),
     check("hindi_date", "Hindi Date is required! or should be valid string Formate(dd-mm-yyyy)").not().isEmpty(),

     check("english_message", "English Message is required").not().isEmpty(),
     check("english_reference", "English Reference is required").not().isEmpty(),
     check("english_date", "English Date is required! or should be valid string Formate(dd-mm-yyyy)").not().isEmpty(),

     check("translitration_message", "Translitration Message is required").not().isEmpty(),
     check("translitration_reference", "Translitration Reference is required").not().isEmpty(),
     check("translitration_date", "Translitration Date is required! or should be valid string Formate(dd-mm-yyyy)").not().isEmpty()
]

exports.push_Notification = [
     check("text", "text is required").not().isEmpty(),

]

exports.createNewAssessmentValidation = [
     check("assessment_name", "Assessment Name is required").not().isEmpty(),
     check("assessment_desc", "Assessment Description is required").not().isEmpty(),
     check("total_marks", "Assessment Total marks is required").not().isEmpty(),
];


exports.addQuestionWithOptionsValidation = [
     check("english_question", "english question is required").not().isEmpty(),
     check("urdu_question", "urdu question is required").not().isEmpty(),
     check("hindi_question", "hindi question is required").not().isEmpty(),
     check("transliteration_question", "translitration question is required").not().isEmpty(),
 
     check("marks", "Question Mark is required").not().isEmpty(),
     check("time_limit", "Question Time Limit is required").not().isEmpty(),
     check("options", "Options array of object is required").not().isEmpty(),
 
     check("options.*.english_option", "english option is required").not().isEmpty(),
     check("options.*.urdu_option", "urdu option is required").not().isEmpty(),
     check("options.*.hindi_option", "hindi option is required").not().isEmpty(),
     check("options.*.transliteration_option", "translitration option is required").not().isEmpty(),
     check("options.*.is_answer", "is answer is required").not().isEmpty(),
 ];

exports.updateQuestionWithOptionsValidation = [
     check("assessment_questions.*.group_id", "group_id is required").not().isEmpty(),

     check("assessment_questions.*.english_question", "english question is required").not().isEmpty(),
     check("assessment_questions.*.urdu_question", "urdu question is required").not().isEmpty(),
     check("assessment_questions.*.hindi_question", "hindi question is required").not().isEmpty(),
     check("assessment_questions.*.transliteration_question", "translitration question is required").not().isEmpty(),

     check("assessment_questions.*.options", "options array of object is required").not().isEmpty(),
     check("assessment_questions.*.options.*.option_id", "options array is required").not().isEmpty(),

     check("assessment_questions.*.options.*.english_option", "english_option is required").not().isEmpty(),
     check("assessment_questions.*.options.*.urdu_option", "english_option is required").not().isEmpty(),
     check("assessment_questions.*.options.*.hindi_option", "english_option is required").not().isEmpty(),
     check("assessment_questions.*.options.*.transliteration_option", "english_option is required").not().isEmpty(),
     
     check("assessment_questions.*.options.*.is_answer", "is_answer is required").not().isEmpty(),
 ];