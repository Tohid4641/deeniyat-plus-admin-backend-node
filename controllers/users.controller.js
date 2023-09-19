const { validationResult } = require("express-validator");
const { CustomValidation } = require("express-validator/src/context-items");
const firebase = require('firebase-admin');
var { getMessaging } = require("firebase-admin/messaging");
const client = require("../configs/db.config");

// firebase.initializeApp({
//     credential: firebase.credential.cert({
//       projectId: process.env.serviceAccount_PROJECT_ID,
//       clientEmail: process.env.serviceAccount_CLIENT_EMAIL,
//       privateKey: process.env.serviceAccount_PRIVATE_KEY
//     })
//   });

exports.featureAndBenefitList = async (req, res) => {
    try {
        // query validation
        if (!req.query.language_id || req.query.language_id == '') {
            return res.status(400).json({ errors: "Please include language_id in query" });
        };
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory_id in query" });
        };
        const bfandf = await client.query(`SELECT features_and_benefits_details.fb_detail_id, features_and_benefits_details.title
         , features_and_benefits_details.description ,features_and_benefits.image_path ,features_and_benefits.subcategory_id   
           from features_and_benefits_details
           LEFT JOIN features_and_benefits ON features_and_benefits.fb_id=features_and_benefits_details.fb_id where features_and_benefits.subcategory_id =$1 AND features_and_benefits_details.language_id =$2 order by features_and_benefits_details.fb_detail_id asc

           `, [req.query.subcategory_id, req.query.language_id])

        if (bfandf.rowCount > 0) {
            res.status(200).json({
                result: true,
                message: "success",
                data: bfandf.rows
            });
        } else {
            res.status(403).json({
                result: false,
                message: "Database Err! data not found",

            });

        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.subCategoryData = async (req, res) => {
    try {
        if (!req.query.language_id || req.query.language_id == '') {
            return res.status(400).json({ errors: "Please include language_id in query" });
        };
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory_id in query" });
        };
        ws = await client.query(`SELECT i.language_id, json_agg(json_build_object('wts_detail_id',i.wts_detail_id,'wts_id', sc.workshop_ten_step_id,'step_no',i.step_no,'step_name',
         i.step_name, 'description', i.description,'video_path',i.video_path,'duaration',i.duaration,	'language_id',	i.language_id) order by i.wts_detail_id asc)
         AS list from public.workshop_ten_steps_details i 
        left join public.workshop_ten_steps sc on  i.workshop_ten_step_id=sc.workshop_ten_step_id 
        where sc.subcategory_id=$1 AND i.language_id =$2 group by i.language_id `, [req.query.subcategory_id, req.query.language_id]);

        if (ws.rows.length != 0) {
            res.status(200).json({
                result: true,
                message: "success",
                data: ws.rows[0]["list"]
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Data not found",

            });

        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.subCategoryDataWithSublist = async (req, res) => {
    try {
        if (!req.query.language_id || req.query.language_id == '') {
            return res.status(400).json({ errors: "Please include language_id in query" });
        };
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory_id in query" });
        };
        if (!req.query.school_workshop_ten_step_id || req.query.school_workshop_ten_step_id == '') {
            return res.status(400).json({ errors: "Please include school_workshop_ten_step_id in query" });
        };
        scw1 = await client.query(`SELECT i.language_id , json_agg(json_build_object('swts_detail_id',i.swts_detail_id,'school_workshop_ten_step_id',scw.school_workshop_ten_step_id,'language_id',i.language_id,'title', i.title, 'description', i.desc,'subcategory_id',scw.subcategory_id) order by i.swts_detail_id asc ) AS list
         from school_workshop_ten_steps_details i LEFT JOIN school_workshop_ten_steps scw ON i.school_workshop_ten_step_id=scw.school_workshop_ten_step_id 
         where scw.subcategory_id=$1 AND scw.school_workshop_ten_step_id=$2  AND i.language_id =$3 group by i.language_id `, [req.query.subcategory_id, req.query.school_workshop_ten_step_id, req.query.language_id])

        if (scw1.rows.length != 0) {
            res.status(200).json({
                result: true,
                message: "success",
                data: scw1.rows[0]["list"]
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Data not found",
                data: scw1.rows
            });

        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.subCategorieOfsubCategorieList = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        // query validation
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory_id in query" });
        };
        const scw = await client.query(`SELECT * FROM school_workshop_ten_steps WHERE subcategory_id = $1`, [req.query.subcategory_id])
        if (scw.rows.length != 0) {
            res.status(200).json({
                result: true,
                message: "success",
                data: scw.rows
            });
            // console.log("client", client);
        } else {
            res.status(200).json({
                result: false,
                message: "Data not found",
                data: scw.rows
            });

        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.getJobDescriptionList = async (req, res) => {
    try {
        // query validation
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory ID in query" });
        };

        const { subcategory_id } = req.query;

        const jd_list = await client.query("SELECT * FROM public.job_descriptions WHERE subcategory_id=$1", [subcategory_id]);

        if (jd_list.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                data: jd_list.rows
            });
        } else {
            return res.status(500).json({
                result: false,
                message: "Database error while fetching list",
                data: null
            });
        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.JobDescriptionDetailList = async (req, res) => {
    try {
        if (!req.query.language_id || req.query.language_id == '') {
            return res.status(400).json({ errors: "Please include language_id in query" });
        };
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory_id in query" });
        };
        if (!req.query.job_description_id || req.query.job_description_id == '') {
            return res.status(400).json({ errors: "Please include job_description_id in query" });
        };
        jobDesc = await client.query(`SELECT i.language_id , json_agg(json_build_object('job_description_detail_id',i.job_description_detail_id,'job_description_id',scw.job_description_id,'title', i.title, 'description', i.description,'subcategory_id',scw.subcategory_id) order by i.job_description_detail_id asc ) AS list
         from job_description_details i LEFT JOIN job_descriptions scw ON i.job_description_id=scw.job_description_id 
         where scw.subcategory_id=$1 AND scw.job_description_id=$2  AND i.language_id =$3 group by i.language_id `, [req.query.subcategory_id, req.query.job_description_id, req.query.language_id])

        if (jobDesc.rows.length != 0) {
            res.status(200).json({
                result: true,
                message: "success",
                data: jobDesc.rows[0]["list"]
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Data not found",
                data: jobDesc.rows
            });

        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.supervisionList = async (req, res) => {
    try {
        // query validation
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory ID in query" });
        };

        const { subcategory_id } = req.query;

        const jd_list = await client.query("SELECT * FROM public.supervision WHERE subcategory_id=$1", [subcategory_id]);

        if (jd_list.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                data: jd_list.rows
            });
        } else {
            return res.status(500).json({
                result: false,
                message: "Database error while fetching list",
                data: null
            });
        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.supervisionData = async (req, res) => {
    try {
        // query validation


        if (!req.query.language_id || req.query.language_id == '') {
            return res.status(400).json({ errors: "Please include language_id in query" });
        };

        if (!req.query.month_id || req.query.month_id == '') {
            return res.status(400).json({ errors: "Please include month_id in query" });
        };

        if (!req.query.supervision_id || req.query.supervision_id == '') {
            return res.status(400).json({ errors: "Please include supervision_id in query" });
        };

        const months = await client.query("SELECT i.note_id,i.notes,i.month_id,i.year_id,i.switch FROM public.supervision_maktab_notes i where supervision_id=$1 and month_id=$2 and language_id =$3 order by i.note_id asc", [req.query.supervision_id, req.query.month_id, req.query.language_id]);

        if (months.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                data: months.rows
            });
        } else {
            return res.status(500).json({
                result: false,
                message: "Database error while fetching list",
                data: null
            });
        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.supervisionMonth = async (req, res) => {
    try {
        // query validation

        const { subcategory_id } = req.query;

        const months = await client.query("SELECT * FROM public.months");

        if (months.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                data: months.rows
            });
        } else {
            return res.status(500).json({
                result: false,
                message: "Database error while fetching list",
                data: null
            });
        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.getByExam = async (req, res) => {
    try {
        // query validation

        if (!req.query.exam_id || req.query.exam_id == '') {
            return res.status(400).json({ errors: "Please include exam_id in query" });
        };

        const years = await client.query("SELECT yt.years_title_id ,yt.title ,json_agg(json_build_object('year_id',i.year_id,'year',year,'year_link',i.years_link) order by year_id asc) FROM public.years i left join years_title yt on i.years_title_id=yt.years_title_id where exam_id=$1 group by yt.years_title_id order by yt.years_title_id asc", [req.query.exam_id]);

        if (years.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                data: years.rows
            });
        } else {
            return res.status(500).json({
                result: false,
                message: "Database error while fetching list",
                data: null
            });
        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.dailyPost = async (req, res) => {
    try {
        // query validation


        if (!req.query.language_id || req.query.language_id == '') {
            return res.status(400).json({ errors: "Please include language_id in query" });
        };

        const months = await client.query("SELECT i.dp_id,i.message,i.reference,i.date,i.language_id FROM daily_posts i where i.language_id =$1 order by i.date asc", [req.query.language_id]);

        if (months.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                data: months.rows
            });
        } else {
            return res.status(500).json({
                result: false,
                message: "Database error while fetching list",
                data: null
            });
        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.subCategoryMedia = async (req, res) => {
    try {
        // query validation


        if (!req.query.language_id || req.query.language_id == '') {
            return res.status(400).json({ errors: "Please include language_id in query" });
        };
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include language_id in query" });
        };

        const months = await client.query("SELECT * FROM public.sub_category_media i where i.language_id =$1 and i.subcategory_id=$2", [req.query.language_id, req.query.subcategory_id]);

        if (months.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                data: months.rows
            });
        } else {
            return res.status(500).json({
                result: false,
                message: "Database error while fetching list",
                data: null
            });
        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

// Get Assessment - R
exports.getAssessment = async (req, res) => {
    try {
        // query validation
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory ID in query!" });
        };

        const subcategory_id = req.query.subcategory_id;
        var language_id = req.query.language_id;
        var jd_id = null;
        var assessment_details = [];

        // If subcategory is Maktab
        if (subcategory_id == 2 || subcategory_id == 5) {
            // query validation
            if (!req.query.jd_id && !req.query.school_workshop_ten_step_id && !req.query.workshop_ten_step_id) {
                return res.status(400).json({ errors: "Maktab section assessment must require job description ID in query!" });
            };
            jd_id = req.query.jd_id || req.query.school_workshop_ten_step_id || req.query.workshop_ten_step_id;

            assessment_details = await client.query("SELECT * FROM assessments WHERE jd_id=$1 AND subcategory_id=$2", [jd_id, subcategory_id]);
        } else {
            assessment_details = await client.query("SELECT * FROM assessments WHERE subcategory_id=$1", [subcategory_id]);
        }
        if (assessment_details.rowCount > 0) {
            // Get questions
            const assessment_questions = await client.query("SELECT * FROM assessment_questions WHERE assessment_id=$1", [assessment_details.rows[0].assessment_id]);
            assessment_details.rows[0].total_marks = (assessment_questions.rowCount / 4) * 10;
            if (assessment_questions.rowCount > 0) {

                for (let i = 0; i < assessment_questions.rows.length; i++) {
                    let question = assessment_questions.rows[i];
                    let assessment_questions_options = await client.query("SELECT * FROM assessment_questions_options WHERE question_id=$1", [question.question_id])
                    if (assessment_questions_options.rowCount > 0) {

                        let options = assessment_questions_options.rows.filter(option => option.question_id == question.question_id);
                        assessment_questions.rows[i].options = options
                    }
                }
                if (language_id == 1) {
                    return res.status(200).json({
                        result: true,
                        message: "Successfully get assessment all data!",
                        data: {
                            assessment_details: assessment_details.rows[0],
                            assessment_questions: assessment_questions.rows.filter(q => q.language_id == 1),
                        }
                    });
                } else if (language_id == 2) {
                    return res.status(200).json({
                        result: true,
                        message: "Successfully get assessment all data!",
                        data: {
                            assessment_details: assessment_details.rows[0],
                            assessment_questions: assessment_questions.rows.filter(q => q.language_id == 2),
                        }
                    });
                } else if (language_id == 3) {
                    return res.status(200).json({
                        result: true,
                        message: "Successfully get assessment all data!",
                        data: {
                            assessment_details: assessment_details.rows[0],
                            assessment_questions: assessment_questions.rows.filter(q => q.language_id == 3),
                        }
                    });
                }
                else if (language_id == 4) {
                    return res.status(200).json({
                        result: true,
                        message: "Successfully get assessment all data!",
                        data: {
                            assessment_details: assessment_details.rows[0],
                            assessment_questions: assessment_questions.rows.filter(q => q.language_id == 4),
                        }
                    });
                }
                return res.status(200).json({
                    result: true,
                    message: "Successfully get assessment all data!",
                    data: {
                        assessment_details: assessment_details.rows[0],
                        assessment_questions: assessment_questions.rows,
                    }
                });
            } else {
                return res.status(200).json({
                    result: false,
                    message: "Sorry! Couldn't find assessment questions",
                    data: []
                });
            }
        } else {
            return res.status(200).json({
                result: false,
                message: "Sorry! Couldn't find assessment details",
                data: []
            });
        }
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.syllabusCourse = async (req, res) => {

    try {
        // query validation
        if (!req.query.language_id || req.query.language_id == '') {
            return res.status(400).json({ errors: "Please include language_id in query" });
        };
        const support = await client.query("SELECT * FROM public.option_publication_syllabus i where i.language_id =$1 order by i.group_id,i.language_id asc", [req.query.language_id]);
        if (support.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                data: support.rows
            });
        } else {
            return res.status(500).json({
                result: false,
                message: "Database error while fetching list",
                data: null
            });
        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.syllabusDetails = async (req, res) => {
    try {
        // query validation
        if (!req.query.language_id || req.query.language_id == '') {
            return res.status(400).json({ errors: "Please include language_id in query" });
        };
        if (!req.query.pub_syllabus_id || req.query.pub_syllabus_id == '') {
            return res.status(400).json({ errors: "Please include pub_syllabus_id in query" });
        };
        const support = await client.query("SELECT * FROM public.option_syllabus_details i where i.language_id =$1 and pub_syllabus_id=$2 order by group_id asc", [req.query.language_id, req.query.pub_syllabus_id]);
        if (support.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                data: support.rows
            })
        } else {
            return res.status(500).json({
                result: false,
                message: "Database error while fetching list",
                data: null
            });
        }
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.support = async (req, res) => {

    try {
        if (!req.query.language_id || req.query.language_id == '') {
            return res.status(400).json({ errors: "Please include language_id in query" });
        };
        if (!req.query.assist_option_id || req.query.assist_option_id == '') {
            return res.status(400).json({ errors: "Please include assist_option_id in query" });
        };
        const support = await client.query("SELECT oa.*, oam.option_assis_img as assist_image, link_one, link_two FROM public.option_assist as oa left join option_assist_main as oam on oa.assist_main_id = oam.option_assist_main_id where oa.language_id =$1 and oa.assist_option_id=$2 order by assist_main_id asc", [req.query.language_id, req.query.assist_option_id]);
        if (support.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                data: support.rows
            });
        } else {
            return res.status(500).json({
                result: false,
                message: "Database error while fetching list",
                data: null
            });
        };
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.addFbaseToken = async (req, res) => {
    if (!req.body.device_id || !req.body.token) { throw { message: "Please Pass all the required Payloads!" } }
    let getFbaseTokenQuery = "SELECT * FROM public.tokens where device_id = $1";
    var queryParams = [req.body.device_id];
    let getFbaseTokenQuery_result = await client.query(getFbaseTokenQuery, queryParams);

    if (getFbaseTokenQuery_result.rowCount > 0) {
        let oldFbaseToken = getFbaseTokenQuery_result.rows[0].token;
        getMessaging().unsubscribeFromTopic(oldFbaseToken, "daily_post")

        let updateFbaseTokenQuery = "update public.tokens set token = $1 where device_id = $2";
        var queryParams = [req.body.token, req.body.device_id];
        let updateFbaseTokenQuery_result = await client.query(updateFbaseTokenQuery, queryParams);

        getMessaging().subscribeToTopic(req.body.token, "daily_post")
            .then((response) => {
                return res.status(200).json({
                    success: true,
                    message: "Firebase Token Updated Successfully!"
                })
            })
            .catch((error) => {
                return res.status(402).json({
                    success: false,
                    message: "Firebase Token updated Successfully but failed to subscribe to topic",
                    Description: error
                })
            });
    } else {
        let addFbaseTokenQuery = "insert into public.tokens (token, device_id) values ($1, $2) returning token";
        var queryParams = [req.body.token, req.body.device_id];
        let addFbaseTokenQuery_result = await client.query(addFbaseTokenQuery, queryParams);
        let token = addFbaseTokenQuery_result.rows[0].token;
        if (token) {

            getMessaging().subscribeToTopic(token, "daily_post")
                .then((response) => {
                    return res.status(200).json({
                        success: true,
                        message: "Firebase Token Added Successfully!"
                    })
                })
                .catch((error) => {
                    return res.status(402).json({
                        success: false,
                        message: "Firebase Token Added Successfully but failed to subscribe to topic",
                        Description: error
                    })
                });
        } else {
            return res.status(402).json({
                success: false,
                message: "Failed to add firebase token!"
            })
        }
    }
}