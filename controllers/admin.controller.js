const { validationResult } = require("express-validator");
const { CustomValidation } = require("express-validator/src/context-items");
const moment = require("moment");
const cron = require('node-cron');
const { hijriToCalendars } = require('./hijriToCalender');
var { getMessaging } = require("firebase-admin/messaging");
const firebase = require('firebase-admin');
const client = require("../configs/db.config");
const path = require('path');

// DASHBOARD APIs
// READ - Dashboard view API
exports.dashboard = async (req, res) => {
    try {
        console.log("welcome to dashboard : user", req.user);

        // READ - View all Dashboard data
        // ......

        // READ - View All Categories
        const categories = await client.query("SELECT * FROM public.categories");

        if (categories.rowCount > 0) {

            // READ - View all Subcategories
            const subcategories = await client.query("SELECT * FROM public.subcategories");

            if (subcategories.rowCount > 0) {
                return res.status(200).json({
                    result: true,
                    message: "success",
                    data: {
                        dashboard_data: null,
                        analytics_data: null,
                        default_video_data: null,
                        categories: [...categories.rows],
                        subcategories: [...subcategories.rows]
                    }
                });
            };
        };

    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

// MAKTAB and SCHOOL API's
// CREATE - features and Benifits and Details for MAKTAB and SCHOOL by its ID
exports.addFeaturesAndBenefits = async (req, res, next) => {
    try {
        // console.log("req.file",req.file)
        // finds the validation errors in this request and wraps them in an object with handy functions
        const errors = validationResult(req.body);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        // file validation
        if (!req.file || req.file == 'undefined') {
            return res.status(400).json({ errors: "You must select an image." });
        };

        let image_path = req.file.filename

        // query validation
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory ID in query" });
        };

        // require inputs
        let {
            urdu_title,
            urdu_desc,
            hindi_title,
            hindi_desc,
            english_title,
            english_desc,
            translitration_title,
            translitration_desc
        } = req.body;

        // subcategory ID
        const subcategory_id = req.query.subcategory_id;
        // currentUser
        const user = req.user

        // check if subcategory_id is valid in subcategories table
        const getSubcategory = await client.query("SELECT EXISTS (SELECT * FROM subcategories WHERE subcategory_id = $1) AS it_does_exist;", [subcategory_id]);

        if (getSubcategory.rows[0].it_does_exist == true) {

            // if success first insert image_path in features_and_benefits
            const features_and_benefits = await client.query("INSERT INTO public.features_and_benefits (image_path, subcategory_id,created_by_id) VALUES ($1,$2,$3) returning fb_id", [image_path, subcategory_id, user.user_id]);

            if (features_and_benefits.rowCount > 0) {

                // Get all languages
                const getLanguages = await client.query("SELECT * FROM languages");

                // if successfully fetch all languages
                if (getLanguages.rowCount > 0) {

                    // Add all data in features_and_benefits_details for checking valid language id for all language title and description
                    for (const langObj of getLanguages.rows) {


                        if (langObj.language == "English") {

                            var features_and_benefits_details_english = await client.query("INSERT INTO public.features_and_benefits_details (title, description, fb_id, language_id, created_by_id) VALUES ($1,$2,$3,$4,$5)", [english_title, english_desc, features_and_benefits.rows[0].fb_id, langObj.language_id, user.user_id]);


                        } else if (langObj.language == "Urdu") {
                            var features_and_benefits_details_urdu = await client.query("INSERT INTO public.features_and_benefits_details (title, description, fb_id, language_id, created_by_id) VALUES ($1,$2,$3,$4,$5)", [urdu_title, urdu_desc, features_and_benefits.rows[0].fb_id, langObj.language_id, user.user_id]);


                        } else if (langObj.language == "English - Transliteration") {
                            var features_and_benefits_details_translitration = await client.query("INSERT INTO public.features_and_benefits_details (title, description, fb_id, language_id, created_by_id) VALUES ($1,$2,$3,$4,$5)", [translitration_title, translitration_desc, features_and_benefits.rows[0].fb_id, langObj.language_id, user.user_id]);


                        } else if (langObj.language == "Hindi") {
                            var features_and_benefits_details_hindi = await client.query("INSERT INTO public.features_and_benefits_details (title, description, fb_id, language_id, created_by_id) VALUES ($1,$2,$3,$4,$5)", [hindi_title, hindi_desc, features_and_benefits.rows[0].fb_id, langObj.language_id, user.user_id]);
                        };

                    };

                    // if all insertion enrtries is done successfully
                    if (features_and_benefits_details_english.rowCount > 0 &&
                        features_and_benefits_details_urdu.rowCount > 0 &&
                        features_and_benefits_details_translitration.rowCount > 0 &&
                        features_and_benefits_details_hindi.rowCount > 0) {
                        return res.status(200).json({
                            result: true,
                            message: "Successfully Added Features and Benefits Details",
                            category: "Features"
                        });
                    } else {
                        return res.status(500).json({
                            result: false,
                            message: "Database Insertion Error in features_and_benefits_details table",
                            data: null
                        });
                    };

                } else {
                    return res.status(500).json({
                        result: false,
                        message: "Database Error in languages table",
                        data: getLanguages
                    });
                };

            } else {
                return res.status(500).json({
                    result: false,
                    message: "Database Insertion Error in features_and_benefits table",
                    data: features_and_benefits
                });
            };
        } else {
            return res.status(500).json({
                result: false,
                message: "Database Subcategory ID does not exist",
                data: getSubcategory
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

// READ - features and Benifits and Details for MAKTAB and SCHOOL by its ID
exports.featuresAndBenefitsList = async (req, res) => {

    try {

        // query validation
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include Subcategory ID in query" });
        };

        fb = await client.query(`SELECT features_and_benefits.fb_id,features_and_benefits.image_path,features_and_benefits.subcategory_id

         ,json_agg(json_build_object('fb_detail_id',features_and_benefits_details.fb_detail_id,'title', features_and_benefits_details.title,

          'description', features_and_benefits_details.description,'launguage',features_and_benefits_details.language_id    ) order by features_and_benefits_details.language_id desc) AS list

           from features_and_benefits_details

            LEFT JOIN features_and_benefits ON features_and_benefits.fb_id=features_and_benefits_details.fb_id where features_and_benefits.subcategory_id =$1

             group by features_and_benefits.fb_id order by features_and_benefits.fb_id asc `, [req.query.subcategory_id])

        if (fb.rows.length != 0) {

            res.status(200).json({

                result: true,

                message: "success",

                featuresAndBenefits: fb.rows

            });

        } else {

            res.status(200).json({

                result: false,

                message: "features benefits list Data not found",

                featuresAndBenefits: fb.rows

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

// DELETE - features and Benifits and Details for MAKTAB and SCHOOL by its ID
exports.deleteFeaturesAndBenifits = async (req, res) => {

    try {

        // query validation
        if (!req.query.fb_id || req.query.fb_id == '') {
            return res.status(400).json({ errors: "Please include fb_id in query" });
        };

        const fb_id = req.query.fb_id;


        const fs = require("fs")
        const path = require("path")
        const fb1 = await client.query("SELECT * FROM features_and_benefits WHERE fb_id = $1", [fb_id])

        if (fb1.rows.length > 0) {
            const filePath = path.join(__dirname + "/../public/uploads/", fb1.rows[0]["image_path"]);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    console.log('File deleted successfully');
                });
            }
        }
        // check if fb_id is valid
        const check_fb_id = await client.query("SELECT EXISTS (SELECT * FROM features_and_benefits WHERE fb_id = $1) AS it_does_exist;", [fb_id]);

        if (check_fb_id.rows[0].it_does_exist == true) {

            const fb = await client.query(`DELETE FROM features_and_benefits WHERE fb_id = $1`, [fb_id]);


            if (fb.rowCount > 0) {

                return res.status(200).json({

                    result: true,

                    message: "Features And Benefits Deleted Successfully!",

                    data: fb.rows[0]

                });

            } else {

                res.status(200).json({

                    result: false,

                    message: "Data not found",

                    data: fb.rows[0]

                });

            };
        } else {
            res.status(500).json({
                result: false,
                message: "Invalid ID",
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

// EDIT - features and Benifits and Details for MAKTAB and SCHOOL by its ID
exports.featuresAndBenefitsEdit = async (req, res) => {

    try {

        // query validation
        if (!req.query.fb_id || req.query.fb_id == '') {
            return res.status(400).json({ errors: "Please include Feature Benefits Details ID in query" });
        };

        const fb = await client.query(`SELECT * FROM features_and_benefits_details LEFT JOIN features_and_benefits ON features_and_benefits_details.fb_id= features_and_benefits.fb_id WHERE features_and_benefits.fb_id= $1 order by features_and_benefits_details.language_id desc;`, [req.query.fb_id])

        // console.log(fb.rows[0])
        const obj = {}
        // const v=    { urdu_title: ele.title, urdu_desc: "", hindi_title: "", hindi_desc: "", english_title: "", english_desc: "", translitration_title: "", translitration_desc: "", file: "" }
        let aa = await Promise.all(fb.rows.map(async (el) => {
            return (el.language_id == 4 ? (obj.hindi_desc = el.description, obj.hindi_title = el.title) : el.language_id == 3 ?
                (obj.translitration_desc = el.description, obj.translitration_title = el.title) : el.language_id == 2 ?
                    (obj.urdu_title = el.title, obj.urdu_desc = el.description) : el.language_id == 1 ? (obj.english_title = el.title, obj.english_desc = el.description) : "not found")
        }))
        obj.file = fb.rows[0]["image_path"]
        if (fb.rows.length != 0) {

            res.status(200).json({

                result: true,

                message: "success",

                featuresAndBenefitsData: obj

            });

        } else {

            res.status(200).json({

                result: false,

                message: "Data not found",

                featuresAndBenefitsData: fb.rows

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

// UPDATE - features and Benifits and Details for MAKTAB and SCHOOL by its ID
exports.updateFeaturesAndBenefits = async (req, res, next) => {
    try {
        // finds the validation errors in this request and wraps them in an object with handy functions

        const errors = validationResult(req.body);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        // query validation
        if (!req.query.fb_id || req.query.fb_id == '') {
            return res.status(400).json({ errors: "Please include Feature Benefits ID in query" });
        };
        // query validation
        if (!req.query.details_ids || req.query.details_ids == '') {
            return res.status(400).json({ errors: "Please include array of Feature Benefits Details IDs in query" });
        };

        // file validation

        const fs = require('fs');
        const path = require('path')
        const fb_id = req.query.fb_id;
        const fb1 = await client.query("SELECT * FROM features_and_benefits WHERE fb_id = $1", [fb_id])
        const filePath = path.join(__dirname + "/../public/uploads/", fb1.rows[0]["image_path"]);
        let image_path
        if (req.file || !req.file == "undefined") {
            image_path = req.file.filename
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    console.log('File deleted successfully');
                });
            }
        } else {
            image_path = fb1.rows[0]["image_path"]
        }
        // require inputs
        let {
            urdu_title,
            urdu_desc,
            hindi_title,
            hindi_desc,
            english_title,
            english_desc,
            translitration_title,
            translitration_desc
        } = req.body;
        // subcategory ID

        // details IDs

        var d_ids = JSON.parse(req.query.details_ids);
        // currentUser
        const user = req.user;
        // check if subcategory_id is valid in subcategories table
        const check_fb_id = await client.query("SELECT EXISTS (SELECT * FROM features_and_benefits WHERE fb_id = $1) AS it_does_exist;", [fb_id]); if (check_fb_id.rows[0].it_does_exist == true) {
            // if success first insert image_path in features_and_benefits
            const update_features_and_benefits = await client.query("UPDATE public.features_and_benefits SET image_path = $1, modified_by_id = $2 WHERE fb_id = $3", [image_path, user.user_id, fb_id]);
            if (update_features_and_benefits.rowCount > 0) {
                // Get all languages
                const getLanguages = await client.query("SELECT * FROM languages");
                // if successfully fetch all languages
                if (getLanguages.rowCount > 0) {
                    // Add all data in features_and_benefits_details for checking valid language id for all language title and description
                    for (const langObj of getLanguages.rows) {
                        if (langObj.language_id == 1) {
                            var features_and_benefits_details_english = await client.query("UPDATE public.features_and_benefits_details SET title=$1, description=$2, modified_by_id=$3 WHERE fb_id=$4 AND fb_detail_id=$5", [english_title, english_desc, user.user_id, fb_id, d_ids[3]]);
                        } else if (langObj.language_id == 2) {
                            var features_and_benefits_details_urdu = await client.query("UPDATE public.features_and_benefits_details SET title=$1, description=$2, modified_by_id=$3 WHERE fb_id=$4 AND fb_detail_id=$5", [urdu_title, urdu_desc, user.user_id, fb_id, d_ids[2]]);
                        } else if (langObj.language_id == 3) {
                            var features_and_benefits_details_translitration = await client.query("UPDATE public.features_and_benefits_details SET title=$1, description=$2, modified_by_id=$3 WHERE fb_id=$4 AND fb_detail_id=$5", [translitration_title, translitration_desc, user.user_id, fb_id, d_ids[1]]);
                        } else if (langObj.language_id == 4) {
                            var features_and_benefits_details_hindi = await client.query("UPDATE public.features_and_benefits_details SET title=$1, description=$2, modified_by_id=$3 WHERE fb_id=$4 AND fb_detail_id=$5", [hindi_title, hindi_desc, user.user_id, fb_id, d_ids[0]]);
                        };
                    };
                    // if all insertion enrtries is done successfully
                    if (features_and_benefits_details_english.rowCount > 0 &&
                        features_and_benefits_details_urdu.rowCount > 0 &&
                        features_and_benefits_details_translitration.rowCount > 0 &&
                        features_and_benefits_details_hindi.rowCount > 0) {
                        return res.status(200).json({
                            result: true,
                            message: "Successfully Updated Features and Benefits Details",
                        });
                    } else {
                        return res.status(500).json({
                            result: false,
                            message: "Database Update Error in features_and_benefits_details table",
                            data: null
                        });
                    };

                } else {
                    return res.status(500).json({
                        result: false,
                        message: "Database Error in languages table",
                        data: getLanguages
                    });
                };

            } else {
                return res.status(500).json({
                    result: false,
                    message: "Database Update Error in features_and_benefits table",
                    data: update_features_and_benefits
                });
            };
        } else {
            return res.status(500).json({
                result: false,
                message: "Database Error ID does not exist",
                data: getSubcategory
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
//school workshop edit
exports.SchoolWorkShopTenStepsEdit = async (req, res) => {

    try {

        // query validation
        if (!req.query.chapter_id || req.query.chapter_id == '') {
            return res.status(400).json({ errors: "Please include chapter_id in query" });
        };

        const fb = await client.query(`SELECT * FROM school_workshop_ten_steps_details i WHERE i.chapter_id= $1 order by i.language_id desc;`, [req.query.chapter_id])

        // console.log(fb.rows[0])
        const obj = {}
        // const v=    { urdu_title: ele.title, urdu_desc: "", hindi_title: "", hindi_desc: "", english_title: "", english_desc: "", translitration_title: "", translitration_desc: "", file: "" }
        // let aa = await Promise.all(fb.rows.map(async (el) => {
        //     (el.language_id == 4 ? (obj.hindi_desc= el.desc,obj.hindi_title=el.title) :el.language_id == 3 ?
        //      (obj.translitration_desc= el.desc ,obj.translitration_title= el.title ): el.language_id == 2 ? 
        //      (obj.urdu_title=el.title,obj.urdu_desc= el.desc) :el.language_id == 1 ? (obj.english_title= el.title,obj.english_desc= el.desc) :"Not found")
        //     return 
        // }))
        if (fb.rows.length != 0) {
            for (const el of fb.rows) {
                if (el.language_id == 4) {
                    obj.hindi_desc = el.desc
                    obj.hindi_title = el.title
                    obj.hindi_title1 = el.title1
                    obj.hindi_desc1 = el.desc1
                }
                if (el.language_id == 3) {
                    obj.english_lit_desc = el.desc
                    obj.english_lit_title = el.title
                    obj.english_lit_title1 = el.title1
                    obj.english_lit_desc1 = el.desc1
                }
                if (el.language_id == 2) {
                    obj.urdu_desc = el.desc
                    obj.urdu_title = el.title
                    obj.urdu_desc1 = el.title1
                    obj.urdu_title1 = el.desc1
                }
                if (el.language_id == 1) {
                    obj.english_desc = el.desc
                    obj.english_title = el.title
                    obj.english_desc1 = el.title1
                    obj.english_title1 = el.desc1
                }
            }
            obj.chapter_id = fb.rows[0]["chapter_id"]
            obj.school_workshop_ten_step_id = fb.rows[0]["school_workshop_ten_step_id"]
            obj.created_by_id = fb.rows[0]["created_by_id"]
            res.status(200).json({
                result: true,
                message: "success",
                schoolwsEdit: obj,
                schooldata: fb.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Data not found",
                schoolwsEdit: fb.rows
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


// School - Workshop in 10 steps - APIs Medicine apis
// CREATE
exports.SchoolWorkShopTenStepsAdd = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        let date = `${new Date().toISOString().slice(0, 10)}`;
        // console.log(date)
        // console.log(req.body)
        var chapter = await client.query("SELECT chapter_id from school_workshop_ten_steps_details order by swts_detail_id desc limit 1")
        let chapter_id = 1
        if (chapter.rowCount > 0) {
            chapter_id = chapter.rows[0].chapter_id + 1
        }

        const languageList = await client.query("SELECT * from languages")

        for (let index = 0; index < languageList.rows.length; index++) {
            const element = languageList.rows[index];
            console.log(element.language)
            if (element.language == "Urdu") {
                scwshop = await client.query('INSERT INTO public."school_workshop_ten_steps_details"  ("school_workshop_ten_step_id","title","desc","language_id","created_by_id","is_active","chapter_id","desc1","title1") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning school_workshop_ten_step_id', [req.body.school_workshop_ten_step_id, req.body.urdu_title, req.body.urdu_desc, element.language_id, req.body.created_by_id, req.body.is_active, chapter_id, req.body.urdu_desc1, req.body.urdu_title1])

            }
            if (element.language == "English") {
                scwshop = await client.query('INSERT INTO public."school_workshop_ten_steps_details"  ("school_workshop_ten_step_id","title","desc","language_id","created_by_id","is_active","chapter_id","desc1","title1") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning school_workshop_ten_step_id', [req.body.school_workshop_ten_step_id, req.body.english_title, req.body.english_desc, element.language_id, req.body.created_by_id, req.body.is_active, chapter_id, req.body.english_desc1, req.body.english_title1])

            }
            if (element.language == "English - Transliteration") {
                scwshop = await client.query('INSERT INTO public."school_workshop_ten_steps_details"  ("school_workshop_ten_step_id","title","desc","language_id","created_by_id","is_active","chapter_id","desc1","title1") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning school_workshop_ten_step_id', [req.body.school_workshop_ten_step_id, req.body.english_lit_title, req.body.english_lit_desc, element.language_id, req.body.created_by_id, req.body.is_active, chapter_id, req.body.english_lit_desc1, req.body.english_lit_title1])

            }
            if (element.language == "Hindi") {
                scwshop = await client.query('INSERT INTO public."school_workshop_ten_steps_details"  ("school_workshop_ten_step_id","title","desc","language_id","created_by_id","is_active","chapter_id","desc1","title1") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning school_workshop_ten_step_id', [req.body.school_workshop_ten_step_id, req.body.hindi_title, req.body.hindi_desc, element.language_id, req.body.created_by_id, req.body.is_active, chapter_id, req.body.hindi_desc1, req.body.hindi_title1])

            }
        }
        res.status(200).json({
            result: true,
            message: "Workshop 10 Steps Details Added Successfully!",
            category: "school workshop",
            data: scwshop.rows[0]["school_workshop_ten_step_id"]
        });


    } catch (error) {
        console.log(error)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

// READ
exports.SchoolWorkShopTenStepsList = async (req, res) => {
    try {
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory_id in query" });
        };
        if (!req.query.school_workshop_ten_step_id || req.query.school_workshop_ten_step_id == '') {
            return res.status(400).json({ errors: "Please include subcategory_id in query" });
        };
        scw1 = await client.query(`SELECT i.chapter_id, json_agg(json_build_object('swts_detail_id',i.swts_detail_id,'school_workshop_ten_step_id',scw.school_workshop_ten_step_id,'language_id',i.language_id,'title', i.title, 'description', i.desc,'subcategory_id',scw.subcategory_id)order by i.language_id desc ) AS list
         from school_workshop_ten_steps_details i LEFT JOIN school_workshop_ten_steps scw ON i.school_workshop_ten_step_id=scw.school_workshop_ten_step_id 
         where scw.subcategory_id=$1 AND scw.school_workshop_ten_step_id=$2  group by i.chapter_id order by i.chapter_id asc   `, [req.query.subcategory_id, req.query.school_workshop_ten_step_id])

        if (scw1.rows.length != 0) {
            res.status(200).json({
                result: true,
                message: "success",
                scwdata: scw1.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "school work shop Data not found",
                scwdata: scw1.rows
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

// UPDATE
exports.SchoolWorkShopTenStepsUpdate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        let date = `${new Date().toISOString().slice(0, 10)}`;
        // console.log(date)
        // console.log(req.body)

        //   var scwshop = await client.query('UPDATE public.school_workshop_ten_steps SET  "subcategory_id"=$1,"created_by_id"=$2,"created_on"=$3,"modified_by_id"=$4,"modified_on"=$5,"is_active"=$6,"title"=$7 where school_workshop_ten_step_id=$8', [req.body.subcategory_id, req.body.created_by_id, date,req.body.modified_by_id, date, req.body.is_active,req.body.title,req.body.school_workshop_ten_step_id])

        //  scwshop = await client.query('UPDATE public."school_workshop_ten_steps_details"  SET "school_workshop_ten_step_id"=$1,"title"=$2,"desc"=$3,"language_id""desc"=$4,"created_by_id"=$5,"created_on"=$6,"modified_by_id"=$7,"modified_on"=$8,"is_active" WHERE swts_detail_id=$9', [scwshop.rows[0]["school_workshop_ten_step_id"],req.body.urdu_title,req.body.urdu_desc,element.language_id, req.body.created_by_id, date,req.body.modified_by_id, date, req.body.is_active])

        const scw = await client.query(`SELECT * FROM school_workshop_ten_steps_details WHERE chapter_id = $1`, [req.body.chapter_id])
        // console.log(scw.rows)
        if (scw.rows.length != 0) {
            const languageList = await client.query("SELECT * from languages")

            for (let index = 0; index < languageList.rows.length; index++) {
                const element = languageList.rows[index];
                //   console.log(element.language)
                console.log("sadsad", scw.rows[index].swts_detail_id)
                if (element.language == "Urdu") {
                    scwshop = await client.query('UPDATE public."school_workshop_ten_steps_details"  SET "school_workshop_ten_step_id"=$1,"title"=$2,"desc"=$3,"language_id"=$4,"modified_by_id"=$5,"modified_on"=$6,"is_active"=$7 ,"title1"=$8,"desc1"=$9  WHERE swts_detail_id=$10', [req.body.school_workshop_ten_step_id, req.body.urdu_title, req.body.urdu_desc, element.language_id, req.body.modified_by_id, date, req.body.is_active, req.body.urdu_title1, req.body.urdu_desc1, scw.rows[index].swts_detail_id])
                    console.log("sadsad", scw.rows[index].swts_detail_id)
                }
                if (element.language == "English") {
                    scwshop = await client.query('UPDATE public."school_workshop_ten_steps_details"  SET "school_workshop_ten_step_id"=$1,"title"=$2,"desc"=$3,"language_id"=$4,"modified_by_id"=$5,"modified_on"=$6,"is_active"=$7 ,"title1"=$8,"desc1"=$9 WHERE swts_detail_id=$10', [req.body.school_workshop_ten_step_id, req.body.english_title, req.body.english_desc, element.language_id, req.body.modified_by_id, date, req.body.is_active, req.body.english_title1, req.body.english_desc1, scw.rows[index].swts_detail_id])

                }
                if (element.language == "English - Transliteration") {
                    scwshop = await client.query('UPDATE public."school_workshop_ten_steps_details"  SET "school_workshop_ten_step_id"=$1,"title"=$2,"desc"=$3,"language_id"=$4,"modified_by_id"=$5,"modified_on"=$6,"is_active"=$7 ,"title1"=$8,"desc1"=$9 WHERE swts_detail_id=$10', [req.body.school_workshop_ten_step_id, req.body.english_lit_title, req.body.english_lit_desc, element.language_id, req.body.modified_by_id, date, req.body.is_active, req.body.english_lit_title1, req.body.english_lit_desc1, scw.rows[index].swts_detail_id])

                }
                if (element.language == "Hindi") {
                    scwshop = await client.query('UPDATE public."school_workshop_ten_steps_details"  SET "school_workshop_ten_step_id"=$1,"title"=$2,"desc"=$3,"language_id"=$4,"modified_by_id"=$5,"modified_on"=$6,"is_active"=$7 ,"title1"=$8,"desc1"=$9 WHERE swts_detail_id=$10', [req.body.school_workshop_ten_step_id, req.body.hindi_title, req.body.hindi_desc, element.language_id, req.body.modified_by_id, date, req.body.is_active, req.body.hindi_title1, req.body.hindi_desc1, scw.rows[index].swts_detail_id])

                }
            }
            res.status(200).json({
                result: true,
                message: "Successfully updated school workshop ten steps details",
                data: scwshop.rows
            });


        } else {
            res.status(200).json({
                result: false,
                message: "school workshop ten steps Data not found",
                data: scw.rows
            });

        };


    } catch (error) {
        console.log(error)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

// EDIT
exports.SchoolWorkShopTenStepsEdit1 = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        // query validation
        if (!req.query.chapter_id || req.query.chapter_id == '') {
            return res.status(400).json({ errors: "Please include chapter_id in query" });
        };
        const scw = await client.query(`SELECT * FROM school_workshop_ten_steps_details WHERE chapter_id = $1`, [req.query.chapter_id])
        // console.log(scw)
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

// DELETE
exports.SchoolWorkShopTenStepsDelete = async (req, res) => {
    try {
        if (!req.query.chapter_id || req.query.chapter_id == '') {
            return res.status(400).json({ errors: "Please include chapter_id in query" });
        };

        const scw = await client.query(`DELETE FROM school_workshop_ten_steps_details WHERE chapter_id = $1`, [req.query.chapter_id])
        // console.log(scw)
        if (scw.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "Workshop 10 Steps Details Deleted Successfully!",
                data: scw.rows[0]
            });
        } else {
            res.status(200).json({
                result: false,
                message: " Data not found",
                data: scw.rows[0]
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

exports.SchoolWorkShopTenStepsRead = async (req, res) => {
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
                steps: scw.rows
            });
            // console.log("client", client);
        } else {
            res.status(200).json({
                result: false,
                message: "school_workshop_ten_steps Data not found",
                steps: scw.rows
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


// Maktab - Job Description API
// READ
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
                message: "job_descriptions success",
                data: jd_list.rows
            });
        } else {
            return res.status(200).json({
                result: false,
                message: "Database error while fetching list",
                data: jd_list.rows
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


// Maktab - Job Description Details API's
//CREATE
exports.addJobDescriptionDetails = async (req, res) => {
    try {
        // inputs validation
        // finds the validation errors in this request and wraps them in an object with handy functions
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        // query validation
        if (!req.query.jd_id || req.query.jd_id == '') {
            return res.status(400).json({ errors: 'Please include a Job Description ID in query' });
        };

        // require inputs
        let { jd_id } = req.query;
        let {
            urdu_title,
            urdu_desc,
            hindi_title,
            hindi_desc,
            english_title,
            english_desc,
            translitration_title,
            translitration_desc
        } = req.body;

        var group_id = 0;
        let user = req.user;

        const getMaxNum = await client.query("SELECT MAX(group_id) FROM job_description_details");

        if (getMaxNum.rowCount > 0) {
            if (getMaxNum.rows[0].max == null) {
                // console.log("number is null");
                group_id = 1;
            }
            else {
                // console.log("number is not null");
                group_id = parseInt(getMaxNum.rows[0].max) + 1;
            };

            // check if jd_id is valid in job_description table
            const check_jd_id = await client.query("SELECT EXISTS (SELECT * FROM job_descriptions WHERE job_description_id = $1) AS it_does_exist;", [jd_id]);

            if (check_jd_id.rows[0].it_does_exist == true) {


                // Main insert logic

                // Get all languages
                const getLanguages = await client.query("SELECT * FROM languages");

                // if successfully fetch all languages
                if (getLanguages.rowCount > 0) {

                    // Add all data in jd details for checking valid language id for all language title and description
                    for (const langObj of getLanguages.rows) {


                        if (langObj.language == "English") {

                            var job_description_details_english = await client.query("INSERT INTO public.job_description_details (title, description, job_description_id, group_id, language_id, created_by_id) VALUES ($1,$2,$3,$4,$5,$6)", [english_title, english_desc, jd_id, group_id, langObj.language_id, user.user_id]);


                        } else if (langObj.language == "Urdu") {
                            var job_description_details_urdu = await client.query("INSERT INTO public.job_description_details (title, description, job_description_id, group_id, language_id, created_by_id) VALUES ($1,$2,$3,$4,$5,$6)", [urdu_title, urdu_desc, jd_id, group_id, langObj.language_id, user.user_id]);


                        } else if (langObj.language == "English - Transliteration") {
                            var job_description_details_translitration = await client.query("INSERT INTO public.job_description_details (title, description, job_description_id, group_id, language_id, created_by_id) VALUES ($1,$2,$3,$4,$5,$6)", [translitration_title, translitration_desc, jd_id, group_id, langObj.language_id, user.user_id]);


                        } else if (langObj.language == "Hindi") {
                            var job_description_details_hindi = await client.query("INSERT INTO public.job_description_details (title, description, job_description_id, group_id, language_id, created_by_id) VALUES ($1,$2,$3,$4,$5,$6)", [hindi_title, hindi_desc, jd_id, group_id, langObj.language_id, user.user_id]);
                        };

                    };

                    // if all insertion enrtries is done successfully
                    if (job_description_details_english.rowCount > 0 &&
                        job_description_details_urdu.rowCount > 0 &&
                        job_description_details_translitration.rowCount > 0 &&
                        job_description_details_hindi.rowCount > 0) {
                        return res.status(200).json({
                            result: true,
                            message: "Job Description Details Added Successfully!",
                            catogory: "Job Description"
                        });
                    } else {
                        return res.status(500).json({
                            result: false,
                            message: "Database Insertion Error in Job Description Details table",
                            data: null
                        });
                    };

                } else {
                    return res.status(500).json({
                        result: false,
                        message: "Database Error in languages table",
                        data: getLanguages
                    });
                };



            } else {
                return res.status(500).json({
                    result: false,
                    message: "Database error or jd_id does not exist",
                    data: null
                });
            }

        } else {
            return res.status(500).json({
                result: false,
                message: "Database error",
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

// EDIT
exports.editJobDescriptionDetails = async (req, res) => {
    try {
        // query validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include group_id in query" });
        };
        const jdd = await client.query(`SELECT * FROM job_description_details WHERE group_id = $1`, [req.query.group_id])
        const obj = {}
        if (jdd.rowCount > 0) {
            for (const el of jdd.rows) {
                if (el.language_id == 4) {
                    obj.hindi_desc = el.description
                    obj.hindi_title = el.title

                }
                if (el.language_id == 3) {
                    obj.translitration_desc = el.description
                    obj.translitration_title = el.title

                }
                if (el.language_id == 2) {
                    obj.urdu_desc = el.description
                    obj.urdu_title = el.title
                    obj.urdu_desc1 = el.title1
                    obj.urdu_title1 = el.desc1
                }
                if (el.language_id == 1) {
                    obj.english_desc = el.description
                    obj.english_title = el.title

                }
            }
            obj.group_id = jdd.rows[0]["group_id"]
            res.status(200).json({
                result: true,
                message: "success",
                jddEdit: obj,
                jdd_data: jdd.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Database Err! data not found",
                jddEdit: jdd.rows
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
// READ - LIST
exports.getJobDescriptionDetailsList = async (req, res) => {
    try {
        // query validation
        if (!req.query.jd_id || req.query.jd_id == '') {
            return res.status(400).json({ errors: "Please include jd_id in query" });
        };
        const jdd_list = await client.query(`SELECT i.group_id, json_agg(json_build_object('job_description_detail_id',i.job_description_detail_id,'title', i.title, 'description', i.description,'language_id',i.language_id)order by i.language_id desc) AS list
        from job_description_details i where i.job_description_id=$1 group by i.group_id order by group_id asc`, [req.query.jd_id])

        if (jdd_list.rowCount > 0) {
            res.status(200).json({
                result: true,
                message: "Job Description data retrived successfully",
                getJobDescriptionDetails: jdd_list.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Database Err! data not found",
                getJobDescriptionDetails: jdd_list.rows
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

// UPDATE
exports.updateJobDescriptionDetails = async (req, res) => {
    try {
        // inputs validation
        // finds the validation errors in this request and wraps them in an object with handy functions
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        // query validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: 'Please include a Group ID in query' });
        };

        // require inputs
        let group_id = req.query.group_id;
        let {
            urdu_title,
            urdu_desc,
            hindi_title,
            hindi_desc,
            english_title,
            english_desc,
            translitration_title,
            translitration_desc
        } = req.body;

        let user = req.user;
        let date = moment().format();
        // console.log("date", date)

        // check if group_id is valid in subcategories table
        const check_group_id = await client.query("SELECT EXISTS (SELECT * FROM job_description_details WHERE group_id = $1) AS it_does_exist;", [group_id]);


        if (check_group_id.rows[0].it_does_exist == true) {


            // Main insert logic

            // Get all languages
            const getLanguages = await client.query("SELECT * FROM languages");

            // if successfully fetch all languages
            if (getLanguages.rowCount > 0) {

                // Add all data in jd details for checking valid language id for all language title and description
                for (const langObj of getLanguages.rows) {


                    if (langObj.language == "English") {

                        var job_description_details_english = await client.query("UPDATE public.job_description_details SET title=$1,description=$2,modified_by_id=$3,modified_on=$4 WHERE language_id=$5 AND group_id=$6", [english_title, english_desc, user.user_id, date, langObj.language_id, group_id]);

                        // var job_description_details_english = await client.query(`UPDATE public.job_description_details SET title='fgdfffgffdfdffdffdffd',description='aaaaaaaa',modified_by_id='10',modified_on='2023-02-24 15:03:11.132935+05:30' WHERE language_id='1' AND group_id='1'`);

                        console.log("job_description_details_english", job_description_details_english)


                    } else if (langObj.language == "Urdu") {
                        var job_description_details_urdu = await client.query("UPDATE public.job_description_details SET title=$1,description=$2,modified_by_id=$3,modified_on=$4 WHERE language_id=$5 AND group_id=$6", [urdu_title, urdu_desc, user.user_id, date, langObj.language_id, group_id]);


                    } else if (langObj.language == "English - Transliteration") {
                        var job_description_details_translitration = await client.query("UPDATE public.job_description_details SET title=$1,description=$2,modified_by_id=$3,modified_on=$4 WHERE language_id=$5 AND group_id=$6", [translitration_title, translitration_desc, user.user_id, date, langObj.language_id, group_id]);


                    } else if (langObj.language == "Hindi") {
                        var job_description_details_hindi = await client.query("UPDATE public.job_description_details SET title=$1,description=$2,modified_by_id=$3,modified_on=$4 WHERE language_id=$5 AND group_id=$6", [hindi_title, hindi_desc, user.user_id, date, langObj.language_id, group_id]);
                    };

                };

                // if all insertion enrtries is done successfully
                if (job_description_details_english.rowCount > 0 &&
                    job_description_details_urdu.rowCount > 0 &&
                    job_description_details_translitration.rowCount > 0 &&
                    job_description_details_hindi.rowCount > 0) {
                    return res.status(200).json({
                        result: true,
                        message: "Successfully Updated Job Description Details",
                    });
                } else {
                    return res.status(500).json({
                        result: false,
                        message: "Database Update Error in Job Description Details table",
                        data: null
                    });
                };

            } else {
                return res.status(500).json({
                    result: false,
                    message: "Database Error in languages table",
                    data: getLanguages
                });
            };



        } else {
            return res.status(500).json({
                result: false,
                message: "Database error or jd_id does not exist",
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

// DELETE
exports.deleteJobDescriptionDetails = async (req, res) => {
    try {
        // query validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: 'Please include a Group ID in query' });
        };
        const group_id = req.query.group_id;

        // check if fb_id is valid
        const check_group_id = await client.query("SELECT EXISTS (SELECT * FROM job_description_details WHERE group_id = $1) AS it_does_exist;", [group_id]);

        if (check_group_id.rows[0].it_does_exist == true) {

            const jdd = await client.query(`DELETE FROM job_description_details WHERE group_id = $1`, [group_id]);


            if (jdd.rowCount > 0) {

                return res.status(200).json({

                    result: true,

                    message: "Job Description Deleted Successfully!",

                    data: jdd.rows[0]

                });

            } else {

                return res.status(402).json({

                    result: true,

                    message: "Data not found",

                    data: jdd.rows[0]

                });

            };
        } else {
            return res.status(500).json({
                result: false,
                message: "Invalid ID",
                data: null
            });
        };

    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    }
};

// work shop ten ,employee ,free food
exports.WorkShopTenStepsList = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        scw = await client.query(`SELECT sc.workshop_ten_step_id,sc.subcategory_id, json_agg(json_build_object('wts_detail_id',i.wts_detail_id,'step_no',i.step_no,'step_name',
         i.step_name, 'description', i.description,'video_path',i.video_path,'duaration',i.duaration,	'language_id',	i.language_id)order by i.language_id desc)
         AS list from public.workshop_ten_steps_details i 
        left join public.workshop_ten_steps sc on  i.workshop_ten_step_id=sc.workshop_ten_step_id 
        where sc.subcategory_id=$1 group by sc.workshop_ten_step_id order by sc.workshop_ten_step_id asc`, [req.query.subcategory_id])

        if (scw.rows.length != 0) {
            res.status(200).json({
                result: true,
                message: "Work Shop 10 Steps Details",
                workshopData: scw.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Data not found",
                workshopData: scw.rows
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
exports.WorkShopTenStepsAdd = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        let date = `${new Date().toISOString().slice(0, 10)}`;
        var chapter_id = Math.floor(Math.random() * 90000) + 10000
        const languageList = await client.query("SELECT * from languages")
        var wshop = await client.query('INSERT INTO public."workshop_ten_steps"  ("subcategory_id","created_by_id") VALUES ($1,$2) returning workshop_ten_step_id', [req.body.subcategory_id, req.body.created_by_id])
        for (let index = 0; index < languageList.rows.length; index++) {
            const element = languageList.rows[index];
            // console.log(element.language)
            if (element.language == "Urdu") {
                let wshop1 = await client.query('INSERT INTO public."workshop_ten_steps_details"  ("workshop_ten_step_id","step_no","step_name","duaration","video_path","description","language_id","created_by_id")  VALUES ($1,$2,$3,$4,$5,$6,$7,$8) returning workshop_ten_step_id', [wshop.rows[0]["workshop_ten_step_id"], req.body.step_no_urdu, req.body.urdu_name, req.body.urdu_duaration, req.body.urdu_video_path, req.body.urdu_description, element.language_id, req.body.created_by_id])

            }
            if (element.language == "English") {
                let wshop2 = await client.query('INSERT INTO public."workshop_ten_steps_details"  ("workshop_ten_step_id","step_no","step_name","duaration","video_path","description","language_id","created_by_id")  VALUES ($1,$2,$3,$4,$5,$6,$7,$8) returning workshop_ten_step_id', [wshop.rows[0]["workshop_ten_step_id"], req.body.step_no_english, req.body.english_name, req.body.english_duaration, req.body.english_video_path, req.body.english_description, element.language_id, req.body.created_by_id])

            }
            if (element.language == "English - Transliteration") {
                let wshop3 = await client.query('INSERT INTO public."workshop_ten_steps_details"  ("workshop_ten_step_id","step_no","step_name","duaration","video_path","description","language_id","created_by_id")  VALUES ($1,$2,$3,$4,$5,$6,$7,$8) returning workshop_ten_step_id', [wshop.rows[0]["workshop_ten_step_id"], req.body.step_no_lit, req.body.english_lit_name, req.body.english_lit_duaration, req.body.english_lit_video_path, req.body.english_lit_description, element.language_id, req.body.created_by_id])

            }
            if (element.language == "Hindi") {
                let wshop4 = await client.query('INSERT INTO public."workshop_ten_steps_details"  ("workshop_ten_step_id","step_no","step_name","duaration","video_path","description","language_id","created_by_id")  VALUES ($1,$2,$3,$4,$5,$6,$7,$8) returning workshop_ten_step_id', [wshop.rows[0]["workshop_ten_step_id"], req.body.step_no_hindi, req.body.hindi_name, req.body.hindi_duaration, req.body.hindi_video_path, req.body.hindi_description, element.language_id, req.body.created_by_id])

            }
        }
        res.status(200).json({
            result: true,
            message: "Successfully Added into workshop ten steps details",
            category: "workshop",
            data: wshop.rows[0]
        });
    } catch (error) {
        console.log(error)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};
exports.WorkShopTenStepsUpdate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        let date = `${new Date().toISOString().slice(0, 10)}`;
        const languageList = await client.query("SELECT * from languages")
        var wshop = await client.query('select * from public."workshop_ten_steps_details" where workshop_ten_step_id=$1 ', [req.body.workshop_ten_step_id])
        for (let index = 0; index < languageList.rows.length; index++) {
            const element = languageList.rows[index];
            // console.log(element.language)
            // console.log(wshop.rows[index].wts_detail_id)
            if (element.language == "Urdu") {
                let wshop1 = await client.query('UPDATE public."workshop_ten_steps_details"  SET "step_no"=$1,"step_name"=$2,"duaration"=$3,"video_path"=$4,"description"=$5,"language_id"=$6,"created_by_id"=$7,"created_on"=$8,"modified_by_id"=$9,"modified_on"=$10,"is_active"=$11 ,"workshop_ten_step_id"=$12 WHERE wts_detail_id=$13', [req.body.step_no_urdu, req.body.urdu_name, req.body.urdu_duaration, req.body.urdu_video_path, req.body.urdu_description, element.language_id, req.body.created_by_id, date, req.body.modified_by_id, date, req.body.is_active, req.body.workshop_ten_step_id, wshop.rows[index].wts_detail_id])

            }
            if (element.language == "English") {
                let wshop2 = await client.query('UPDATE  public."workshop_ten_steps_details" SET "step_no"=$1,"step_name"=$2,"duaration"=$3,"video_path"=$4,"description"=$5,"language_id"=$6,"created_by_id"=$7,"created_on"=$8,"modified_by_id"=$9,"modified_on"=$10,"is_active"=$11,"workshop_ten_step_id"=$12  WHERE wts_detail_id=$13', [req.body.step_no_english, req.body.english_name, req.body.english_duaration, req.body.english_video_path, req.body.english_description, element.language_id, req.body.created_by_id, date, req.body.modified_by_id, date, req.body.is_active, req.body.workshop_ten_step_id, wshop.rows[index].wts_detail_id])

            }
            if (element.language == "English - Transliteration") {
                let wshop3 = await client.query('UPDATE  public."workshop_ten_steps_details" SET "step_no"=$1,"step_name"=$2,"duaration"=$3,"video_path"=$4,"description"=$5,"language_id"=$6,"created_by_id"=$7,"created_on"=$8,"modified_by_id"=$9,"modified_on"=$10,"is_active"=$11 ,"workshop_ten_step_id"=$12 WHERE wts_detail_id=$13', [req.body.step_no_lit, req.body.english_lit_name, req.body.english_lit_duaration, req.body.english_lit_video_path, req.body.english_lit_description, element.language_id, req.body.created_by_id, date, req.body.modified_by_id, date, req.body.is_active, req.body.workshop_ten_step_id, wshop.rows[index].wts_detail_id])

            }
            if (element.language == "Hindi") {
                let wshop4 = await client.query('UPDATE  public."workshop_ten_steps_details" SET "step_no"=$1,"step_name"=$2,"duaration"=$3,"video_path"=$4,"description"=$5,"language_id"=$6,"created_by_id"=$7,"created_on"=$8,"modified_by_id"=$9,"modified_on"=$10,"is_active"=$11,"workshop_ten_step_id"=$12 WHERE wts_detail_id=$13', [req.body.step_no_hindi, req.body.hindi_name, req.body.hindi_duaration, req.body.hindi_video_path, req.body.hindi_description, element.language_id, req.body.created_by_id, date, req.body.modified_by_id, date, req.body.is_active, req.body.workshop_ten_step_id, wshop.rows[index].wts_detail_id])

            }
        }
        res.status(200).json({
            result: true,
            message: "Workshop 10 steps Details Updated Successfully!",
            data: wshop.rows
        });


    } catch (error) {
        console.log(error)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.WorkShopTenStepsDelete = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        const ws = await client.query(`DELETE FROM workshop_ten_steps WHERE workshop_ten_step_id = $1`, [req.query.workshop_ten_step_id])
        if (ws.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "WorkShopTenSteps Deleted Successfully",
                data: ws.rows[0]
            });
        } else {
            res.status(402).json({
                result: false,
                message: "Data not found",
                data: ws.rows[0]
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
exports.editWorkShop = async (req, res) => {
    try {
        // query validation
        if (!req.query.workshop_ten_step_id || req.query.workshop_ten_step_id == '') {
            return res.status(400).json({ errors: "Please include workshop_ten_step_id in query" });
        };
        const jdd = await client.query(`SELECT * FROM workshop_ten_steps_details WHERE workshop_ten_step_id = $1`, [req.query.workshop_ten_step_id])
        const obj = {}
        if (jdd.rowCount > 0) {
            for (const el of jdd.rows) {
                if (el.language_id == 4) {
                    obj.hindi_description = el.description
                    obj.hindi_video_path = el.video_path
                    obj.hindi_duaration = el.duaration
                    obj.step_no_hindi = el.step_no
                    obj.hindi_name = el.step_name
                }
                if (el.language_id == 3) {
                    obj.english_lit_description = el.description
                    obj.english_lit_video_path = el.video_path
                    obj.english_lit_duaration = el.duaration
                    obj.step_no_lit = el.step_no
                    obj.english_lit_name = el.step_name

                }
                if (el.language_id == 2) {
                    obj.urdu_description = el.description
                    obj.urdu_video_path = el.video_path
                    obj.urdu_duaration = el.duaration
                    obj.step_no_urdu = el.step_no
                    obj.urdu_name = el.step_name

                }
                if (el.language_id == 1) {
                    obj.english_description = el.description
                    obj.english_video_path = el.video_path
                    obj.english_duaration = el.duaration
                    obj.step_no_english = el.step_no
                    obj.english_name = el.step_name

                }
            }
            obj.workshop_ten_step_id = jdd.rows[0]["workshop_ten_step_id"]
            res.status(200).json({
                result: true,
                message: "success",
                editwsk: obj,
                wkData: jdd.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Database Err! data not found",
                data: jdd.rows
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

// Maktab - Supervision API
// READ LIST
exports.getSupervisionList = async (req, res) => {
    try {
        // query validation
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory ID in query" });
        };

        const { subcategory_id } = req.query;

        const supervision_list = await client.query("SELECT * FROM public.supervision WHERE subcategory_id=$1", [subcategory_id]);

        if (supervision_list.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                supervisionList: supervision_list.rows
            });
        } else {
            return res.status(200).json({
                result: false,
                message: "Database error while fetching list",
                supervisionList: supervision_list.rows
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

// Months - API
// READ LIST
exports.getMonthList = async (req, res) => {
    try {
        const months = await client.query("SELECT * FROM public.months");

        if (months.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "success",
                Month: months.rows
            });
        } else {
            return res.status(200).json({
                result: false,
                message: "Database error while fetching list",
                Month: months.rows
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


// Maktab - Supervision Notes API
//CREATE
exports.addSupervisionNotes = async (req, res) => {
    try {
        if (!req.body.notes_hindi || req.body.notes_hindi == '') {
            return res.status(400).json({ errors: "Please include notes_hindi  in body" });
        };
        if (!req.body.notes_english || req.body.notes_english == '') {
            return res.status(400).json({ errors: "Please include notes_english  in body" });
        };
        if (!req.body.notes_lit || req.body.notes_lit == '') {
            return res.status(400).json({ errors: "Please include notes_lit  in body" });
        };
        if (!req.body.notes_urdu || req.body.notes_urdu == '') {
            return res.status(400).json({ errors: "Please include notes_urdu  in body" });
        };
        if (!req.body.supervision_id || req.body.supervision_id == '') {
            return res.status(400).json({ errors: "Please include supervision_id  in body" });
        };
        if (!req.body.month_id || req.body.month_id == '') {
            return res.status(400).json({ errors: "Please include month_id  in body" });
        };
        if (!req.body.created_by_id || req.body.created_by_id == '') {
            return res.status(400).json({ errors: "Please include created_by_id  in body" });
        };
        var group = await client.query("SELECT group_id from supervision_maktab_notes order by note_id desc limit 1")
        let group_id = 1
        if (group.rowCount > 0) {
            group_id = Number(group.rows[0].group_id) + 1
        }

        const subcategory1 = await client.query(`INSERT INTO public.supervision_maktab_notes ("notes", "group_id","month_id","supervision_id","language_id","created_by_id") VALUES ($1,$2,$3,$4,$5,$6) `,
            [req.body.notes_hindi, group_id, req.body.month_id, req.body.supervision_id, 4, req.body.created_by_id])
        const subcategory2 = await client.query(`INSERT INTO public.supervision_maktab_notes ("notes", "group_id","month_id","supervision_id",language_id,"created_by_id") VALUES ($1,$2,$3,$4,$5,$6) `,
            [req.body.notes_english, group_id, req.body.month_id, req.body.supervision_id, 1, req.body.created_by_id])
        const subcategory3 = await client.query(`INSERT INTO public.supervision_maktab_notes ("notes", "group_id","month_id","supervision_id",language_id,"created_by_id") VALUES ($1,$2,$3,$4,$5,$6) `,
            [req.body.notes_lit, group_id, req.body.month_id, req.body.supervision_id, 3, req.body.created_by_id])
        const subcategory4 = await client.query(`INSERT INTO public.supervision_maktab_notes ("notes", "group_id","month_id","supervision_id",language_id,"created_by_id") VALUES ($1,$2,$3,$4,$5,$6) `,
            [req.body.notes_urdu, group_id, req.body.month_id, req.body.supervision_id, 2, req.body.created_by_id])


        if (subcategory1.rowCount != 0 && subcategory2.rowCount != 0 && subcategory3.rowCount != 0 && subcategory4.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "Supervision Details Added Successfully!",
                category: "supervision",
                data: subcategory1.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Supervision Notes Some thing went wrong",
                data: subcategory1.rows
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

// READ
exports.getSupervisionNotes = async (req, res) => {
    try {

        // query validation
        if (!req.query.supervision_id || req.query.supervision_id == '') {
            return res.status(400).json({ errors: "Please include Supervision ID in query" });
        };
        // query validation
        if (!req.query.month_id || req.query.month_id == '') {
            return res.status(400).json({ errors: "Please include Month ID in query" });
        };

        const { supervision_id, month_id } = req.query;


        const notes = await client.query("SELECT i.group_id, json_agg(json_build_object( 'note_id',i.note_id,'notes', i.notes ,'language_id',i.language_id)order by language_id desc ) AS list FROM public.supervision_maktab_notes i WHERE supervision_id=$1 AND month_id=$2 group by group_id order by group_id asc ", [supervision_id, month_id]);

        if (notes.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "Super vision Note data retrieved successfully",
                notes: notes.rows
            });
        } else {
            return res.status(200).json({
                result: false,
                message: "Database error while fetching Super vision Note data list",
                notes: notes.rows
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
exports.editNotes = async (req, res) => {
    try {
        // query validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include group_id in query" });
        };
        const jdd = await client.query(`SELECT * FROM supervision_maktab_notes WHERE group_id = $1`, [req.query.group_id])
        const obj = {}
        if (jdd.rowCount > 0) {
            for (const el of jdd.rows) {
                if (el.language_id == 4) {
                    obj.notes_hindi = el.notes


                }
                if (el.language_id == 3) {
                    obj.notes_lit = el.notes


                }
                if (el.language_id == 2) {
                    obj.notes_urdu = el.notes


                }
                if (el.language_id == 1) {
                    obj.notes_english = el.notes


                }
            }
            obj.group_id = jdd.rows[0]["group_id"]
            res.status(200).json({
                result: true,
                message: "success",
                editnotes: obj,
                note_data: jdd.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Database Err! data not found",
                editnotes: jdd.rows
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
// UPDATE
exports.updateSupervisionNotes = async (req, res) => {
    try {
        if (!req.body.notes_hindi || req.body.notes_hindi == '') {
            return res.status(400).json({ errors: "Please include notes_hindi  in body" });
        };
        if (!req.body.notes_english || req.body.notes_english == '') {
            return res.status(400).json({ errors: "Please include notes_english  in body" });
        };
        if (!req.body.notes_lit || req.body.notes_lit == '') {
            return res.status(400).json({ errors: "Please include notes_lit  in body" });
        };
        if (!req.body.notes_urdu || req.body.notes_urdu == '') {
            return res.status(400).json({ errors: "Please include notes_urdu  in body" });
        };
        let date = `${new Date().toISOString().slice(0, 10)}`;
        const subcM = await client.query(`SELECT * FROM supervision_maktab_notes WHERE group_id=$1`, [req.body.group_id])
        let subcategory4
        let subcategory3
        let subcategory2
        let subcategory1
        if (subcM.rows.length <= 0) {
            return res.status(400).json({ errors: "Data not found" });
        }
        for (let index = 0; index < subcM.rows.length; index++) {
            const element = subcM.rows[index];

            if (element["language_id"] == 4) {
                console.log(element["language_id"]);
                subcategory1 = await client.query(`UPDATE public.supervision_maktab_notes SET "notes"=$1, "modified_by_id"=$2,"modified_on"=$3 where note_id=$4 `,
                    [req.body.notes_hindi, req.body.modified_by_id, date, element['note_id']])
            }
            if (element["language_id"] == 1) {
                subcategory2 = await client.query(`UPDATE public.supervision_maktab_notes SET "notes"=$1, "modified_by_id"=$2,"modified_on"=$3 where note_id=$4`,
                    [req.body.notes_english, req.body.modified_by_id, date, element['note_id']])
            }
            if (element["language_id"] == 3) {
                subcategory3 = await client.query(`UPDATE public.supervision_maktab_notes SET "notes"=$1, "modified_by_id"=$2,"modified_on"=$3 where note_id=$4 `,
                    [req.body.notes_lit, req.body.modified_by_id, date, element['note_id']])
            }
            if (element["language_id"] == 2) {
                subcategory4 = await client.query(`UPDATE public.supervision_maktab_notes SET "notes"=$1, "modified_by_id"=$2,"modified_on"=$3 where note_id=$4 `,
                    [req.body.notes_urdu, req.body.modified_by_id, date, element['note_id']])
            }
        }
        if (subcategory1.rowCount != 0 && subcategory2.rowCount != 0 && subcategory3.rowCount != 0 && subcategory4.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "Supervision Details Updated Successfully!",
                data: subcategory1.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "while SupervisionNotes updating Some thing went wrong",
                data: subcategory1.rows
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

// DELETE
exports.deleteSupervisionNotes = async (req, res) => {
    try {
        // validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include Note ID in query" });
        };

        const { group_id } = req.query;

        const deleteNote = await client.query(`DELETE FROM public.supervision_maktab_notes WHERE group_id=$1`, [group_id]);

        if (deleteNote.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "successfully Deleted Note",
            });
        };
        return res.status(500).json({
            result: true,
            message: "Database Error for Deleting Notes",
            data: deleteNote.rows
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};


// Exam Paper API
exports.examPaperList = async (req, res) => {
    try {
        const years = await client.query("SELECT yt.years_title_id,yt.title,array_agg(json_build_object('year_id',year_id,'years_link',years_link,'year',year) order by year_id asc) as years FROM public.years y left join years_title yt on yt.years_title_id=y.years_title_id where exam_id=$1 group by yt.years_title_id order by yt.serial_no asc", [req.query.exam_id]);

        if (years.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "exam Paper Data retrieved successfully",
                examPaperData: years.rows
            });
        } else {
            return res.status(200).json({
                result: false,
                message: "Database error while fetching list",
                examPaperData: years.rows
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
exports.examPaperAdd = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        const year = await client.query(`INSERT INTO public.years (year, created_by_id,created_on,years_link,exam_id,years_title_id) VALUES ($1,$2,$3,$4,$5,$6) `, [req.body.year, req.body.created_by_id, date, req.body.years_link, req.body.exam_id, req.body.years_title_id])
        console.log(year.rows)
        if (year.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "Exam Paper Added Successfully!",
                category: "exam paper",
                data: year.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Some thing went wrong",
                data: year.rows
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
exports.examPaperDelete = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        const ex = await client.query(`DELETE from public.years WHERE year_id = $1`, [req.query.year_id])
        if (ex.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "exam Paper Deleted Successfully",
                data: ex.rows[0]
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Data not found",
                data: ex.rows[0]
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
exports.examPaperCategorieDelete = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;
        // validation
        if (!req.query.years_title_id || req.query.years_title_id == '') {
            return res.status(400).json({ errors: "Please include years_title_id in query" });
        };

        const ex = await client.query(`DELETE from public.years_title WHERE years_title_id = $1`, [req.query.years_title_id])
        if (ex.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "exam Paper Categorie Deleted Successfully",
                data: ex.rows[0]
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Data not found",
                data: ex.rows[0]
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
exports.examPaperCategorieList = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;

        const ex = await client.query(`select * from public.exam_paper `)
        if (ex.rows.length != 0) {
            res.status(200).json({
                result: true,
                message: "examPaperCategorie Data retrieved Successfully",
                excdata: ex.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Data not found",
                excdata: ex.rows
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
exports.addExamPaperCategorie = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;
        // validation
        if (!req.body.title || req.body.title == '') {
            return res.status(400).json({ errors: "Please years title in query" });
        };


        const ex = await client.query(`insert into  public.years_title (title) values ($1)`, [req.body.title])
        console.log(ex)
        if (ex.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "Exam Paper Category Added Successfully!",
                category: "exampaper category",
                data: ex.rows[0]
            });
        } else {
            res.status(200).json({
                result: false,
                message: "some thing went wrong",
                data: ex.rows[0]
            });
        }
    } catch (error) {
        console.log(error)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};
exports.ExamfileCategorie = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;
        // validatio
        const ex = await client.query(`select * from public.years_title order by title asc`,)
        console.log(ex)
        if (ex.rows.length != 0) {
            res.status(200).json({
                result: true,
                message: "ExamfileCategorie Data retrieved Successfully",
                examPaperFile: ex.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "some thing went wrong",
                examPaperFile: ex.rows
            });
        }
    } catch (error) {
        console.log(error)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};
exports.examPaperUpdate = async (req, res) => {
    try {

        let date = `${new Date().toISOString().slice(0, 10)}`;

        if (!req.body.year || req.body.year == '') {
            return res.status(400).json({ errors: "Year required in body" });
        };
        if (!req.body.modified_by_id || req.body.modified_by_id == '') {
            return res.status(400).json({ errors: "Please required modified_by_id in body" });
        };
        if (!req.body.years_link || req.body.years_link == '') {
            return res.status(400).json({ errors: "Please required years_link in body" });
        };
        if (!req.body.exam_id || req.body.exam_id == '') {
            return res.status(400).json({ errors: "Please required exam_id in body" });
        };
        if (!req.body.years_title_id || req.body.years_title_id == '') {
            return res.status(400).json({ errors: "Please required years_title_id in body" });
        };
        if (!req.body.year_id || req.body.year_id == '') {
            return res.status(400).json({ errors: "Please required year_id in body" });
        };


        let ex = await client.query('UPDATE public.years SET year=$1, modified_by_id=$2,modified_on=$3,years_link=$4,exam_id=$5,years_title_id=$6 where year_id=$7', [req.body.year, req.body.modified_by_id, date, req.body.years_link, req.body.exam_id, req.body.years_title_id, req.body.year_id])

        if (ex.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "examPaper Updated Successfully",
                data: ex.rows[0]
            });
        } else {
            res.status(200).json({
                result: true,
                message: "examPaper Data not found",
                data: ex.rows[0]
            });
        }


    } catch (error) {
        console.log(error)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};
//main category media
exports.getSubcategoryMedia = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        //type json formate
        const scm = await client.query(`SELECT sc.subcategory_id, sc.subcategory_name,json_agg(json_build_object('subcategory_media_id',"scm"."subcategory_media_id",'subcategory_media_VideoName',"scm"."subcategory_media_VideoName",'subcategory_media_VideoPath',"scm"."subcategory_media_VideoPath",'language_id',"scm"."language_id",'subcategory_media_VideoDuaration', "scm"."subcategory_media_VideoDuaration", 'subcategory_id', "scm"."subcategory_id")order by scm.language_id desc) AS sub_category_media
        FROM subcategories sc inner join sub_category_media scm on sc.subcategory_id=scm.subcategory_id where scm.subcategory_id=$1  group by sc.subcategory_id  `, [req.query.subcategory_id])

        if (scm.rows.length != 0) {
            const obj = {}

            for (const el of scm.rows[0]["sub_category_media"]) {
                if (el.language_id == 4) {
                    obj.subcategory_media_VideoName_hindi = el.subcategory_media_VideoName
                    obj.subcategory_media_VideoPath_hindi = el.subcategory_media_VideoPath
                    obj.subcategory_media_VideoDuaration_hindi = el.subcategory_media_VideoDuaration

                }
                if (el.language_id == 3) {
                    obj.subcategory_media_VideoName_lit = el.subcategory_media_VideoName
                    obj.subcategory_media_VideoPath_lit = el.subcategory_media_VideoPath
                    obj.subcategory_media_VideoDuaration_lit = el.subcategory_media_VideoDuaration



                }
                if (el.language_id == 2) {
                    obj.subcategory_media_VideoName_urdu = el.subcategory_media_VideoName
                    obj.subcategory_media_VideoPath_urdu = el.subcategory_media_VideoPath
                    obj.subcategory_media_VideoDuaration_urdu = el.subcategory_media_VideoDuaration

                }
                if (el.language_id == 1) {
                    obj.subcategory_media_VideoName_english = el.subcategory_media_VideoName
                    obj.subcategory_media_VideoPath_english = el.subcategory_media_VideoPath
                    obj.subcategory_media_VideoDuaration_english = el.subcategory_media_VideoDuaration


                }
            }

            obj.subcategory_id = scm.rows[0]["subcategory_id"]
            res.status(200).json({
                result: true,
                message: "getSubcategory retrieved successfully",
                media: scm.rows
                , editmedia: obj
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Data not found",
                editmedia: []
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
exports.SubcategoryRead = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        //type json formate
        const sc = await client.query(`select * from public.subcategories `)

        if (sc.rows.length != 0) {
            res.status(200).json({
                result: true,
                message: "success",
                data: sc.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Data not found",
                data: sc.rows
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
exports.SubcategoryUpdate = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        const scw = await client.query(`UPDATE  subcategories SET "VideoName"=$1,"VideoPath"=$2,"VideoDuaration"=$3 WHERE subcategory_id= $4`, [req.body.VideoName, req.body.VideoPath, req.body.VideoDuaration, req.body.subcategory_id])
        console.log(scw)
        if (scw.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "SubcategoryUpdate success",
                data: scw.rows
            });
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

exports.subCategoryMediaAdd = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        // const obj = [{
        //     subcategory_media_VideoName: req.body.subcategory_media_VideoName_hindi,
        //     subcategory_media_VideoDuaration: req.body.subcategory_media_VideoDuaration_hindi,
        //     subcategory_media_VideoPath: req.body.subcategory_media_VideoPath_hindi,
        // }, {
        //     subcategory_media_VideoName: req.body.subcategory_media_VideoName_urdu,
        //     subcategory_media_VideoPath: req.body.subcategory_media_VideoPath_urdu,
        //     subcategory_media_VideoDuaration: req.body.subcategory_media_VideoDuaration_urdu
        // },
        // {
        //     subcategory_media_VideoName: req.body.subcategory_media_VideoName_lit,
        //     subcategory_media_VideoPath: req.body.subcategory_media_VideoPath_lit,
        //     subcategory_media_VideoDuaration: req.body.subcategory_media_VideoDuaration_lit,
        // }, {
        //     subcategory_media_VideoDuaration: req.body.subcategory_media_VideoDuaration_english,
        //     subcategory_media_VideoPath: req.body.subcategory_media_VideoPath_english,
        //     subcategory_media_VideoName: req.body.subcategory_media_VideoName_english,
        // }]
        const subcM = await client.query(`SELECT * FROM subcategories sc inner join sub_category_media scm on sc.subcategory_id=scm.subcategory_id WHERE scm.subcategory_id=$1`, [req.body.subcategory_id])
        if (subcM.rows.length > 1) {
            return res.status(200).json({
                result: false,
                message: "Data of this category already exist,Please Update !",
                data: subcM.rows.length
            });
        }

        const subcategory1 = await client.query(`INSERT INTO public.sub_category_media ("subcategory_media_VideoName", "subcategory_media_VideoPath","subcategory_media_VideoDuaration","subcategory_id","language_id") VALUES ($1,$2,$3,$4,$5) `,
            [req.body.subcategory_media_VideoName_hindi, req.body.subcategory_media_VideoPath_hindi, req.body.subcategory_media_VideoDuaration_hindi, req.body.subcategory_id, 4])
        const subcategory2 = await client.query(`INSERT INTO public.sub_category_media ("subcategory_media_VideoName", "subcategory_media_VideoPath","subcategory_media_VideoDuaration","subcategory_id",language_id) VALUES ($1,$2,$3,$4,$5) `,
            [req.body.subcategory_media_VideoName_english, req.body.subcategory_media_VideoPath_english, req.body.subcategory_media_VideoDuaration_english, req.body.subcategory_id, 1])
        const subcategory3 = await client.query(`INSERT INTO public.sub_category_media ("subcategory_media_VideoName", "subcategory_media_VideoPath","subcategory_media_VideoDuaration","subcategory_id",language_id) VALUES ($1,$2,$3,$4,$5) `,
            [req.body.subcategory_media_VideoName_lit, req.body.subcategory_media_VideoPath_lit, req.body.subcategory_media_VideoDuaration_lit, req.body.subcategory_id, 3])
        const subcategory4 = await client.query(`INSERT INTO public.sub_category_media ("subcategory_media_VideoName", "subcategory_media_VideoPath","subcategory_media_VideoDuaration","subcategory_id",language_id) VALUES ($1,$2,$3,$4,$5) `,
            [req.body.subcategory_media_VideoName_urdu, req.body.subcategory_media_VideoPath_urdu, req.body.subcategory_media_VideoDuaration_urdu, req.body.subcategory_id, 2])


        if (subcategory1.rowCount != 0 && subcategory2.rowCount != 0 && subcategory3.rowCount != 0 && subcategory4.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "subCategoryMedia Added successfully",
                category: "subCategoryMedia",
                data: subcategory1.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Some thing went wrong",
                data: subcategory1.rows
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

exports.subCategoryMediaUpdate = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        // const obj = [{
        //     subcategory_media_VideoName: req.body.subcategory_media_VideoName_hindi,
        //     subcategory_media_VideoDuaration: req.body.subcategory_media_VideoDuaration_hindi,
        //     subcategory_media_VideoPath: req.body.subcategory_media_VideoPath_hindi,
        // }, {
        //     subcategory_media_VideoName: req.body.subcategory_media_VideoName_urdu,
        //     subcategory_media_VideoPath: req.body.subcategory_media_VideoPath_urdu,
        //     subcategory_media_VideoDuaration: req.body.subcategory_media_VideoDuaration_urdu
        // },
        // {
        //     subcategory_media_VideoName: req.body.subcategory_media_VideoName_lit,
        //     subcategory_media_VideoPath: req.body.subcategory_media_VideoPath_lit,
        //     subcategory_media_VideoDuaration: req.body.subcategory_media_VideoDuaration_lit,
        // }, {
        //     subcategory_media_VideoDuaration: req.body.subcategory_media_VideoDuaration_english,
        //     subcategory_media_VideoPath: req.body.subcategory_media_VideoPath_english,
        //     subcategory_media_VideoName: req.body.subcategory_media_VideoName_english,
        // }]

        const subcM = await client.query(`SELECT * FROM subcategories sc inner join sub_category_media scm on sc.subcategory_id=scm.subcategory_id WHERE scm.subcategory_id=$1`, [req.body.subcategory_id])
        let subcategory4
        let subcategory3
        let subcategory2
        let subcategory1
        for (let index = 0; index < subcM.rows.length; index++) {
            const element = subcM.rows[index];

            if (element["language_id"] == 4) {
                console.log(element["language_id"], element['subcategory_media_id']);
                subcategory1 = await client.query(`UPDATE public.sub_category_media SET "subcategory_media_VideoName"=$1, "subcategory_media_VideoPath"=$2,"subcategory_media_VideoDuaration"=$3,"subcategory_id"=$4,"language_id"=$5  where subcategory_media_id=$6 `,
                    [req.body.subcategory_media_VideoName_hindi, req.body.subcategory_media_VideoPath_hindi, req.body.subcategory_media_VideoDuaration_hindi, req.body.subcategory_id, 4, element['subcategory_media_id']])
            }
            if (element["language_id"] == 1) {
                subcategory2 = await client.query(`UPDATE public.sub_category_media SET "subcategory_media_VideoName"=$1, "subcategory_media_VideoPath"=$2,"subcategory_media_VideoDuaration"=$3,"subcategory_id"=$4,"language_id" =$5  where subcategory_media_id=$6`,
                    [req.body.subcategory_media_VideoName_english, req.body.subcategory_media_VideoPath_english, req.body.subcategory_media_VideoDuaration_english, req.body.subcategory_id, 1, element['subcategory_media_id']])
            }
            if (element["language_id"] == 3) {
                subcategory3 = await client.query(`UPDATE public.sub_category_media SET "subcategory_media_VideoName"=$1, "subcategory_media_VideoPath"=$2,"subcategory_media_VideoDuaration"=$3,"subcategory_id"=$4,"language_id" =$5 where subcategory_media_id=$6 `,
                    [req.body.subcategory_media_VideoName_lit, req.body.subcategory_media_VideoPath_lit, req.body.subcategory_media_VideoDuaration_lit, req.body.subcategory_id, 3, element['subcategory_media_id']])
            }
            if (element["language_id"] == 2) {
                subcategory4 = await client.query(`UPDATE public.sub_category_media SET "subcategory_media_VideoName"=$1, "subcategory_media_VideoPath"=$2,"subcategory_media_VideoDuaration"=$3,"subcategory_id"=$4,"language_id" =$5 where subcategory_media_id=$6 `,
                    [req.body.subcategory_media_VideoName_urdu, req.body.subcategory_media_VideoPath_urdu, req.body.subcategory_media_VideoDuaration_urdu, req.body.subcategory_id, 2, element['subcategory_media_id']])
            }
        }
        if (subcategory1.rowCount != 0 && subcategory2.rowCount != 0 && subcategory3.rowCount != 0 && subcategory4.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "subCategoryMedia Updated successfully",
                data: subcategory1.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Some thing went wrong",
                data: subcategory1.rows
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

// Daily Post API's
// CREATE -
exports.addDailyPost = async (req, res, next) => {
    try {

        // finds the validation errors in this request and wraps them in an object with handy functions
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        // require inputs
        let {
            urdu_message,
            urdu_reference,
            urdu_date,

            hindi_message,
            hindi_reference,
            hindi_date,

            english_message,
            english_reference,
            english_date,

            translitration_message,
            translitration_reference,
            translitration_date
        } = req.body;

        // currentUser
        const user = req.user;

        var group_id = 0;

        const getMaxNum = await client.query("SELECT MAX(group_id) FROM daily_posts");

        if (getMaxNum.rowCount > 0) {
            if (getMaxNum.rows[0].max == null) {
                // console.log("number is null");
                group_id = 1;
            }
            else {
                // console.log("number is not null");
                group_id = parseInt(getMaxNum.rows[0].max) + 1;
            };


            // Get all languages
            const getLanguages = await client.query("SELECT * FROM languages");

            // if successfully fetch all languages
            if (getLanguages.rowCount > 0) {

                // Add all data in daily_posts for checking valid language id for all language title and description
                for (const langObj of getLanguages.rows) {


                    if (langObj.language == "English") {

                        var insert_english_daily_post = await client.query("INSERT INTO public.daily_posts (message, reference, date, language_id, created_by_id, group_id) VALUES ($1,$2,$3,$4,$5,$6)", [english_message, english_reference, english_date, langObj.language_id, user.user_id, group_id]);


                    } else if (langObj.language == "Urdu") {
                        var insert_urdu_daily_post = await client.query("INSERT INTO public.daily_posts (message, reference, date, language_id, created_by_id, group_id) VALUES ($1,$2,$3,$4,$5,$6)", [urdu_message, urdu_reference, urdu_date, langObj.language_id, user.user_id, group_id]);


                    } else if (langObj.language == "English - Transliteration") {
                        var insert_translitration_daily_post = await client.query("INSERT INTO public.daily_posts (message, reference, date, language_id, created_by_id, group_id) VALUES ($1,$2,$3,$4,$5,$6)", [translitration_message, translitration_reference, translitration_date, langObj.language_id, user.user_id, group_id]);


                    } else if (langObj.language == "Hindi") {
                        var insert_hindi_daily_post = await client.query("INSERT INTO public.daily_posts (message, reference, date, language_id, created_by_id, group_id) VALUES ($1,$2,$3,$4,$5,$6)", [hindi_message, hindi_reference, hindi_date, langObj.language_id, user.user_id, group_id]);
                    };

                };

                // if all insertion enrtries is done successfully
                if (insert_english_daily_post.rowCount > 0 &&
                    insert_urdu_daily_post.rowCount > 0 &&
                    insert_translitration_daily_post.rowCount > 0 &&
                    insert_hindi_daily_post.rowCount > 0) {
                    getPostDatesQuery();

                    return res.status(200).json({
                        result: true,
                        message: "Successfully Added Daily Post",
                        category: "dailypost"
                    });
                } else {
                    return res.status(200).json({
                        result: false,
                        message: "Database Insertion Error in Daily Posts table",
                        data: null
                    });
                };

            } else {
                return res.status(500).json({
                    result: false,
                    message: "Database Error in languages table",
                    data: getLanguages
                });
            };

        } else {
            return res.status(500).json({
                result: false,
                message: "Database error",
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

// READ
exports.dailyPosts = async (req, res) => {
    try {
        const posts = await client.query(`SELECT group_id,json_agg(json_build_object('dp_id',dp_id,'message',message,'reference',reference,'language_id',"language_id",'date', date) order by language_id desc) AS posts
        FROM public.daily_posts WHERE EXTRACT(MONTH FROM date) = $1 group by group_id order by group_id asc`, [req.query.month]);

        return res.status(200).json({
            result: true,
            message: "All Posts!",
            posts: posts.rows
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            description: error
        });
    };
};
exports.editDailypost = async (req, res) => {
    try {
        // query validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include group_id in query" });
        };
        const jdd = await client.query(`SELECT * FROM daily_posts WHERE group_id = $1`, [req.query.group_id])
        const obj = {}
        if (jdd.rowCount > 0) {
            for (const el of jdd.rows) {
                if (el.language_id == 4) {
                    obj.hindi_desc = el.message


                }
                if (el.language_id == 3) {
                    obj.translitration_desc = el.message


                }
                if (el.language_id == 2) {
                    obj.urdu_desc = el.message

                }
                if (el.language_id == 1) {
                    obj.english_desc = el.message


                }
            }
            obj.group_id = jdd.rows[0]["group_id"]
            res.status(200).json({
                result: true,
                message: "success",
                dailedit: obj,
                daily_data: jdd.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Database Err! data not found",
                dailedit: jdd.rows
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
// UPDATE -
exports.updateDailyPost = async (req, res, next) => {
    try {

        // finds the validation errors in this request and wraps them in an object with handy functions
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        // query validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include Group ID in query" });
        };

        // require inputs
        let {
            urdu_message,
            urdu_reference,
            urdu_date,

            hindi_message,
            hindi_reference,
            hindi_date,

            english_message,
            english_reference,
            english_date,

            translitration_message,
            translitration_reference,
            translitration_date
        } = req.body;

        // currentUser
        const user = req.user;
        let date = moment().format();
        let group_id = req.query.group_id;

        // Get all languages
        const getLanguages = await client.query("SELECT * FROM languages");

        // if successfully fetch all languages
        if (getLanguages.rowCount > 0) {

            // Add all data in daily_posts for checking valid language id for all language title and description
            for (const langObj of getLanguages.rows) {


                if (langObj.language == "English") {

                    var update_english_daily_post = await client.query("UPDATE public.daily_posts SET message=$1,reference=$2,date=$3,modified_by_id=$4,modified_on=$5 WHERE group_id=$6 AND language_id=$7", [english_message, english_reference, english_date, user.user_id, date, group_id, langObj.language_id]);


                } else if (langObj.language == "Urdu") {
                    var update_urdu_daily_post = await client.query("UPDATE public.daily_posts SET message=$1,reference=$2,date=$3,modified_by_id=$4,modified_on=$5 WHERE group_id=$6 AND language_id=$7", [urdu_message, urdu_reference, urdu_date, user.user_id, date, group_id, langObj.language_id]);


                } else if (langObj.language == "English - Transliteration") {
                    var update_translitration_daily_post = await client.query("UPDATE public.daily_posts SET message=$1,reference=$2,date=$3,modified_by_id=$4,modified_on=$5 WHERE group_id=$6 AND language_id=$7", [translitration_message, translitration_reference, translitration_date, user.user_id, date, group_id, langObj.language_id]);


                } else if (langObj.language == "Hindi") {
                    var update_hindi_daily_post = await client.query("UPDATE public.daily_posts SET message=$1,reference=$2,date=$3,modified_by_id=$4,modified_on=$5 WHERE group_id=$6 AND language_id=$7", [hindi_message, hindi_reference, hindi_date, user.user_id, date, group_id, langObj.language_id]);
                };

            };

            // if all updation enrtries is done successfully
            if (update_english_daily_post.rowCount > 0 &&
                update_urdu_daily_post.rowCount > 0 &&
                update_translitration_daily_post.rowCount > 0 &&
                update_hindi_daily_post.rowCount > 0) {
                return res.status(200).json({
                    result: true,
                    message: "Successfully Updated Daily Post",
                });
            } else {
                return res.status(500).json({
                    result: false,
                    message: "Database Insertion Error in Daily Posts table",
                    data: null
                });
            };

        } else {
            return res.status(500).json({
                result: false,
                message: "Database Error in languages table",
                data: getLanguages
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

// READ
exports.deleteDailyPosts = async (req, res) => {
    try {
        // query validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include Group ID in query" });
        };

        const delete_posts = await client.query("DELETE FROM public.daily_posts WHERE group_id=$1", [req.query.group_id]);

        if (delete_posts.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "successfully deleted post!",
                data: delete_posts.rows
            });
        } else {

            res.status(200).json({
                result: false,
                message: "Data not found! or Enter valid group ID",
                data: delete_posts.rows
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
//Support
exports.assistOptionAdd = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;
        let assist1
        let assist2
        let assist3
        let assist4;
        let buy_now_link = req.body.buy_now_link || "";
        let open_app_link = req.body.open_app_link || "";
        let play_store_link = req.body.play_store_link || "";
        let app_store_link = req.body.app_store_link || "";

        if (!req.file || req.file == '') {
            return res.status(400).json({ errors: "Please include image" });
        };

        let assist_option_id = req.body.assist_option_id || null
        let syllabus_id = req.body.syllabus_id || null
        if (assist_option_id && syllabus_id) {
            return res.status(400).json({ errors: "Please include either assist_option_id or syllabus_id in body" });
        };

        if (!assist_option_id && !syllabus_id) {
            return res.status(400).json({ errors: "both cannot be null assist_option_id or syllabus_id in body" });
        };

        if (!req.file || req.file == '') {
            return res.status(400).json({ errors: "Please include image" });
        };


        let assisOptionMain = await client.query(`INSERT INTO public.option_assist_main(
            option_assis_img, buy_now_link, open_app_link, play_store_link, app_store_link)
            VALUES ($1, $2, $3, $4, $5) returning  option_assist_main_id`,
        [req.file.filename, buy_now_link, open_app_link, play_store_link, app_store_link])

        if (assisOptionMain.rowCount > 0) {
            assist1 = await client.query(`INSERT INTO public.option_assist ("assist_title", assist_desc,language_id,assist_option_id,assist_main_id,assist_image,assist_second_heading,e_book_link) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) `,
                [req.body.assist_title_hindi, req.body.assist_desc_hindi, 4, assist_option_id, assisOptionMain.rows[0]['option_assist_main_id'], req.body.assist_image, req.body.assist_second_heading_hindi, req.body.ebookLinkHindi])
            assist2 = await client.query(`INSERT INTO public.option_assist ("assist_title", assist_desc,language_id,assist_option_id,assist_main_id,assist_image,assist_second_heading,e_book_link) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) `,
                [req.body.assist_title_english, req.body.assist_desc_english, 1, assist_option_id, assisOptionMain.rows[0]['option_assist_main_id'], req.body.assist_image, req.body.assist_second_heading_english, req.body.ebookLinkEnglish])
            assist3 = await client.query(`INSERT INTO public.option_assist ("assist_title", assist_desc,language_id,assist_option_id,assist_main_id,assist_image,assist_second_heading,e_book_link) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) `,
                [req.body.assist_title_lit, req.body.assist_desc_lit, 3, assist_option_id, assisOptionMain.rows[0]['option_assist_main_id'], req.body.assist_image, req.body.assist_second_heading_lit, req.body.ebookLinkTranslit])
            assist4 = await client.query(`INSERT INTO public.option_assist ("assist_title", assist_desc,language_id,assist_option_id,assist_main_id,assist_image,assist_second_heading,e_book_link) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) `,
                [req.body.assist_title_urdu, req.body.assist_desc_urdu, 2, assist_option_id, assisOptionMain.rows[0]['option_assist_main_id'], req.body.assist_image, req.body.assist_second_heading_urdu, req.body.ebookLinkUrdu])
        }
        if (assist1.rowCount != 0 && assist2.rowCount != 0 && assist3.rowCount != 0 && assist4.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "assist option Added successfully",
                category: "assist option",
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Some thing went wrong",
                data: []
            });

        };
    } catch (error) {
        console.log(error.message,)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.assistOptionUpdate = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;
        let assist1
        let assist2
        let assist3
        let assist4
        let buy_now_link = req.body.buy_now_link || "";
        let open_app_link = req.body.open_app_link || "";
        let play_store_link = req.body.play_store_link || "";
        let app_store_link = req.body.app_store_link || "";
        let link_three = req.body.link_three || "";

        let assist_option_id = req.body.assist_option_id || null
        let syllabus_id = req.body.syllabus_id || null
        if (assist_option_id && syllabus_id) {
            return res.status(400).json({ errors: "Please include either assist_option_id or syllabus_id in body" });
        };

        if (!assist_option_id && !syllabus_id) {
            return res.status(400).json({ errors: "both cannot be null assist_option_id or syllabus_id in body" });
        };

        const fs = require('fs');
        const path = require('path')

        const assist = await client.query("SELECT * FROM option_assist_main WHERE option_assist_main_id = $1", [req.body.option_assist_main_id])
        const filePath = path.join(__dirname + "/../public/assist/", assist.rows[0]["option_assis_img"]);
        let image_path
        if (req.file || !req.file == "undefined") {
            image_path = req.file.filename
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    console.log('File deleted successfully');
                });
            }
        } else {
            image_path = assist.rows[0]["option_assis_img"]
        }
        const assisOptionMain = await client.query(`UPDATE public.option_assist_main SET
        option_assis_img=$1, buy_now_link=$2, open_app_link=$3, play_store_link=$4, app_store_link = $5 where option_assist_main_id=$6 returning  option_assist_main_id   `,
        [image_path, buy_now_link, open_app_link, play_store_link, app_store_link, req.body.option_assist_main_id])
    // in pogress
        let option_assist_main_id = assisOptionMain.rows[0]['option_assist_main_id']
            ;
        if (assisOptionMain.rowCount > 0) {
            assist1 = await client.query(`UPDATE public.option_assist SET "assist_title"=$1, assist_desc=$2,language_id=$3,assist_option_id=$4, assist_main_id=$5  ,assist_image=COALESCE($6, CAST(assist_image AS VARCHAR)),assist_second_heading=$7,e_book_link=$10 WHERE assist_main_id=$8 AND language_id=$9  `,
                [req.body.assist_title_hindi, req.body.assist_desc_hindi, 4, assist_option_id, option_assist_main_id, req.body.assist_image || null, req.body.assist_second_heading_hindi, option_assist_main_id, 4, ebookLinkHindi])
            assist2 = await client.query(`UPDATE public.option_assist SET "assist_title"=$1, assist_desc=$2,language_id=$3,assist_option_id=$4, assist_main_id=$5 ,assist_image=COALESCE($6, CAST(assist_image AS VARCHAR)),assist_second_heading=$7,e_book_link=$10  WHERE assist_main_id=$8 AND language_id=$9   `,
                [req.body.assist_title_english, req.body.assist_desc_english, 1, assist_option_id, option_assist_main_id, req.body.assist_image || null, req.body.assist_second_heading_english, option_assist_main_id, 1, ebookLinkEnglish])
            assist3 = await client.query(`UPDATE public.option_assist SET "assist_title"=$1, assist_desc=$2,language_id=$3,assist_option_id=$4, assist_main_id=$5  ,assist_image=COALESCE($6, CAST(assist_image AS VARCHAR)),assist_second_heading=$7,e_book_link=$10 WHERE assist_main_id=$8 AND language_id=$9   `,
                [req.body.assist_title_lit, req.body.assist_desc_lit, 3, assist_option_id, option_assist_main_id, req.body.assist_image || null, req.body.assist_second_heading_lit, option_assist_main_id, 3, ebookLinkTranslit])
            assist4 = await client.query(`UPDATE public.option_assist SET "assist_title"=$1, assist_desc=$2,language_id=$3,assist_option_id=$4, assist_main_id=$5 ,assist_image=COALESCE($6, CAST(assist_image AS VARCHAR)),assist_second_heading=$7,e_book_link=$10  WHERE assist_main_id=$8 AND language_id=$9  `,
                [req.body.assist_title_urdu, req.body.assist_desc_urdu, 2, assist_option_id, option_assist_main_id, req.body.assist_image || null, req.body.assist_second_heading_urdu, option_assist_main_id, 2, ebookLinkUrdu])
        }

        if (assist1.rowCount != 0 && assist2.rowCount != 0 && assist3.rowCount != 0 && assist4.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "assist option updated successfully",
                category: "assist option",
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Some thing went wrong",
                data: []
            });

        };
    } catch (error) {
        console.log(error.message,)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};
exports.assistList = async (req, res) => {
    try {
        // query validation
        if (!req.query.assist_option_id || req.query.assist_option_id == '') {
            return res.status(400).json({ errors: "Please include assist_option_id in query!" });
        };
        console.log(req.query)
        const assessment_id = req.query.assist_main_id;

        const assist = await client.query(`SELECT osm.*,json_agg(json_build_object('assist_id',oa.assist_id, 'assist_desc',oa.assist_desc, 'assist_title',oa.assist_title, 'assist_option_id',oa.assist_option_id, 'language_id',oa.language_id, 'assist_main_id',oa.assist_main_id,'assist_second_heading',oa.assist_second_heading
        ) order by oa.language_id asc) AS item FROM option_assist oa  join option_assist_main osm on oa.assist_main_id=osm.option_assist_main_id WHERE oa.assist_option_id=$1 group by osm.option_assist_main_id order by osm.option_assist_main_id asc`, [req.query.assist_option_id]);

        console.log('>>>1', assist.rows.length);

        // assist.rows.forEach(singleRow => {
        //     console.log('>>>2', singleRow);

        //     const urlObj = new URL(singleRow.link_one);
        //     const urlObj2 = new URL(singleRow.link_two);
        //     console.log('>>>3', urlObj, urlObj2);
        //     const link_one = urlObj.hostname;
        //     const link_two = urlObj2.hostname;
        //     console.log(`Domain or Subdomain 1: ${link_one}`);
        //     console.log(`Domain or Subdomain 2: ${link_two}`);

        //     switch (link_one) {
        //         case "apps.apple.com" || "shop.deeniyat.com":
        //             singleRow.openApp = singleRow.link_one;
        //             delete singleRow.link_one;
        //             break;

        //         case "2":
        //             singleRow.openApp = singleRow.link_one;
        //             delete singleRow.link_one;
        //             break;
        //         case "3":

        //             break;
        //         default:
        //             break;
        //     }

        // });

        if (assist.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "Successfully fetched assist details!",
                data: assist.rows,
            });
        }

        return res.status(200).json({
            result: false,
            message: "Unable to fetch assist details!",
            data: assist.rows,
        });


    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};
exports.editAssist = async (req, res) => {
    try {
        // query validation
        if (!req.query.assist_main_id || req.query.assist_main_id == '') {
            return res.status(400).json({ errors: "Please include assist_main_id in query" });
        };
        const assist = await client.query(`SELECT * FROM option_assist left join option_assist_main ON option_assist_main.option_assist_main_id=option_assist.assist_main_id WHERE assist_main_id = $1`, [req.query.assist_main_id])
        const obj = {}
        if (assist.rowCount > 0) {
            for (const el of assist.rows) {
                if (el.language_id == 4) {


                    obj.assist_desc_hindi = el.assist_desc
                    obj.assist_title_hindi = el.assist_title
                }
                if (el.language_id == 3) {

                    obj.assist_title_lit = el.assist_title
                    obj.assist_desc_lit = el.assist_desc
                }
                if (el.language_id == 2) {


                    obj.assist_desc_urdu = el.assist_desc
                    obj.assist_title_urdu = el.assist_title
                }
                if (el.language_id == 1) {

                    obj.assist_desc_english = el.assist_desc
                    obj.assist_title_english = el.assist_title
                }
                obj.assist_main_id = assist.rows[0]["assist_main_id"]
                obj.file = assist?.rows[0]["option_assis_img"]
                obj.link_one = assist?.rows[0]["link_one"]
                obj.link_two = assist?.rows[0]["link_two"]

            }

            res.status(200).json({
                result: true,
                message: "success",
                assist: obj,
                assist_data: assist.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Database Err! data not found",
                assist: assist.rows
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
exports.deleteAssist = async (req, res) => {
    try {
        // query validation
        if (!req.query.assist_main_id || req.query.assist_main_id == '') {
            return res.status(400).json({ errors: "Please include assist_main_id in query" });
        };

        const fs = require("fs")
        const path = require("path")
        const assist = await client.query("SELECT * FROM option_assist_main WHERE option_assist_main_id = $1", [req.query.assist_main_id])

        if (assist.rows.length > 0) {
            const filePath = path.join(__dirname + "/../public/assist/", assist.rows[0]["option_assis_img"]);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    console.log('File deleted successfully');
                });
            }
        }

        const Assist = await client.query("DELETE FROM public.option_assist WHERE assist_main_id=$1", [req.query.assist_main_id]);
        const AssistMain = await client.query("DELETE FROM public.option_assist_main WHERE option_assist_main_id=$1", [req.query.assist_main_id]);

        if (Assist.rowCount > 0 && Assist.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "successfully deleted assist!",
                data: Assist.rows
            });
        } else {

            res.status(200).json({
                result: false,
                message: "Data not found! or Enter assist_main_id",
                data: Assist.rows
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

//syllabus
exports.syllabusList = async (req, res) => {
    try {
        // query validation
        const assist = await client.query(`select group_id,json_agg(json_build_object('syllabus_id',syllabus_id, 'course_title',course_title, 'course_desc',course_desc, 'course_img',course_img, 'language_id',language_id, 'group_id',group_id, 'secondary_title',secondary_title
	 ) order by language_id asc) as course FROM public.option_publication_syllabus group by group_id order by group_id asc`);

        return res.status(200).json({
            result: true,
            message: "Successfully fetched assist details!",
            data: assist.rows
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.syllabusUpdate = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;

        const fs = require("fs")
        const path = require("path")
        let group_id
        let syllabus = await client.query(`select * from public.option_publication_syllabus where group_id =$1`, [req.body.group_id])
        let image_path
        if (req.file || !req.file == "undefined") {
            const filePath = path.join(__dirname + "/../public/assist/", syllabus.rows[0]["course_img"] || "not found");
            image_path = req.file.filename
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    console.log('File deleted successfully');
                });
            }
        } else {
            image_path = syllabus.rows[0]["course_img"] || "not found"
        }
        // let syllabus = await client.query(`select * from public.option_publication_syllabus order by group_id desc`)
        // if (syllabus.rowCount == 0) {
        //     // console.log("number is null");
        //     group_id = 1;
        // }
        // else {
        //     // console.log("number is not null");
        //     group_id = Number(syllabus.rows[0]["group_id"]) + 1;
        // };

        let option_publication_syllabus1 = await client.query(`UPDATE  public.option_publication_syllabus SET
            course_title=$1, course_desc=$2, course_img=$3, language_id=$4, secondary_title=$5 where group_id =$6 and language_id=$7  
                  returning  group_id`,
            [req.body.course_title_hindi, req.body.course_desc_hindi, image_path, 4, req.body.secondary_title_hindi, req.body.group_id, 4])
        let option_publication_syllabus2 = await client.query(`UPDATE  public.option_publication_syllabus SET
            course_title=$1, course_desc=$2, course_img=$3, language_id=$4, secondary_title=$5 where group_id =$6 and language_id=$7  
                  returning  group_id`,
            [req.body.course_title_english, req.body.course_desc_english, image_path, 1, req.body.secondary_title_english, req.body.group_id, 1])
        let option_publication_syllabus3 = await client.query(`UPDATE  public.option_publication_syllabus SET
            course_title=$1, course_desc=$2, course_img=$3, language_id=$4, secondary_title=$5 where group_id =$6 and language_id=$7  
                  returning  group_id`,
            [req.body.course_title_lit, req.body.course_desc_lit, image_path, 3, req.body.secondary_title_lit, req.body.group_id, 3])
        let option_publication_syllabus4 = await client.query(`UPDATE  public.option_publication_syllabus SET
            course_title=$1, course_desc=$2, course_img=$3, language_id=$4, secondary_title=$5 where group_id =$6 and language_id=$7  
                  returning  group_id`,
            [req.body.course_title_urdu, req.body.course_desc_urdu, image_path, 2, req.body.secondary_title_urdu, req.body.group_id, 2])

        if (option_publication_syllabus1.rowCount != 0 && option_publication_syllabus2.rowCount != 0 && option_publication_syllabus3.rowCount != 0 && option_publication_syllabus4.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "syllabus option updated successfully",
                category: "assist option",
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Some thing went wrong",
                data: []
            });

        };
    } catch (error) {
        console.log(error)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};
exports.syllabysDelete = async (req, res) => {
    try {
        // query validation
        // if (!req.query.group_id || req.query.group_id == '') {
        //     return res.status(400).json({ errors: "Please include group_id in query" });
        // };
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include group_id in query" });
        };

        const fs = require("fs")
        const path = require("path")
        let syllabus = await client.query(`select * from public.option_publication_syllabus where group_id =$1`, [req.query.group_id])
        let syllabus1 = await client.query(`select group_id,json_agg(json_build_object('syllabus_image',syllabus_image)) as image from public.option_syllabus_details where pub_syllabus_id =$1 group by group_id`, [req.query.group_id])

        if (syllabus.rows.length > 0) {
            const filePath = path.join(__dirname + "/../public/assist/", syllabus.rows[0]["course_img"] || "not found");
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    console.log('File deleted successfully');
                });
            }
        }
        for (const i in syllabus1.rows) {
            if (syllabus1.rows.length > 0) {
                const filePath = path.join(__dirname + "/../public/assist/", syllabus1?.rows[i]["image"][0]?.syllabus_image || "not found");
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, (err) => {
                        if (err) throw err;
                        console.log('File deleted successfully');
                    });
                }
            }
        }


        const Assist = await client.query("DELETE FROM public.option_publication_syllabus where group_id =$1", [req.query.group_id]);
        const Assist1 = await client.query("DELETE FROM public.option_syllabus_details where pub_syllabus_id =$1", [req.query.group_id]);

        if (Assist.rowCount > 0 && Assist.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "successfully deleted course!",
                data: Assist.rows
            });
        } else {

            res.status(200).json({
                result: false,
                message: "Data not found",
                data: Assist.rows
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
exports.syllabusAdd = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;

        let group_id
        if (!req.file || req.file == '') {
            return res.status(400).json({ errors: "Please include image" });
        };


        let syllabus = await client.query(`select * from public.option_publication_syllabus order by group_id desc`)
        if (syllabus.rowCount == 0) {
            // console.log("number is null");
            group_id = 1;
        }
        else {
            // console.log("number is not null");
            group_id = Number(syllabus.rows[0]["group_id"]) + 1;
        };

        let option_publication_syllabus1 = await client.query(`INSERT INTO public.option_publication_syllabus
            (course_title, course_desc, course_img, language_id, group_id, secondary_title)
                 VALUES ($1, $2, $3,$4,$5,$6) returning  group_id`,
            [req.body.course_title_hindi, req.body.course_desc_hindi, req.file.filename, 4, group_id, req.body.secondary_title_hindi])
        let option_publication_syllabus2 = await client.query(`INSERT INTO public.option_publication_syllabus
            (course_title, course_desc, course_img, language_id, group_id, secondary_title)
                 VALUES ($1, $2, $3,$4,$5,$6) returning  group_id`,
            [req.body.course_title_english, req.body.course_desc_english, req.file.filename, 1, group_id, req.body.secondary_title_english])
        let option_publication_syllabus3 = await client.query(`INSERT INTO public.option_publication_syllabus
            (course_title, course_desc, course_img, language_id, group_id, secondary_title)
                 VALUES ($1, $2, $3,$4,$5,$6) returning  group_id`,
            [req.body.course_title_lit, req.body.course_desc_lit, req.file.filename, 3, group_id, req.body.secondary_title_lit])
        let option_publication_syllabus4 = await client.query(`INSERT INTO public.option_publication_syllabus
            (course_title, course_desc, course_img, language_id, group_id, secondary_title)
                 VALUES ($1, $2, $3,$4,$5,$6) returning  group_id`,
            [req.body.course_title_urdu, req.body.course_desc_urdu, req.file.filename, 2, group_id, req.body.secondary_title_urdu])

        if (option_publication_syllabus1.rowCount != 0 && option_publication_syllabus2.rowCount != 0 && option_publication_syllabus3.rowCount != 0 && option_publication_syllabus4.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "Well done ! syllabus option Added successfully",
                category: "assist option",
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Some thing went wrong",
                data: []
            });

        };
    } catch (error) {
        console.log(error.message,)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};
exports.syllabusEdit = async (req, res) => {
    try {
        // query validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include group_id in query" });
        };
        const syllabus = await client.query(`SELECT * FROM option_publication_syllabus WHERE group_id = $1`, [req.query.group_id])
        const obj = {}
        if (syllabus.rowCount > 0) {
            for (const el of syllabus.rows) {
                if (el.language_id == 4) {
                    obj.course_title_hindi = el.course_title
                    obj.course_desc_hindi = el.course_desc
                    obj.secondary_title_hindi = el.secondary_title
                }
                if (el.language_id == 3) {
                    obj.course_title_lit = el.course_title
                    obj.course_desc_lit = el.course_desc
                    obj.secondary_title_lit = el.secondary_title
                }
                if (el.language_id == 2) {
                    obj.course_title_urdu = el.course_title
                    obj.course_desc_urdu = el.course_desc
                    obj.secondary_title_urdu = el.secondary_title
                }
                if (el.language_id == 1) {
                    obj.course_title_english = el.course_title
                    obj.course_desc_english = el.course_desc
                    obj.secondary_title_english = el.secondary_title
                }
                obj.group_id = syllabus.rows[0]["group_id"]
                obj.file = syllabus.rows[0]["course_img"]
            }

            res.status(200).json({
                result: true,
                message: "success",
                syllabus: obj,
                syllabus_data: syllabus.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Database Err! data not found",
                syllabus: syllabus.rows
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
//Syllabus details
exports.syllabusAddDetails = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;
        // const errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //     return res.status(400).json({ errors: errors.array() });
        // };

        let group_id
        if (!req.file || req.file == '') {
            return res.status(400).json({ errors: "Please include image" });
        };
        let syllabus = await client.query(`select * from public.option_syllabus_details order by group_id desc`)
        if (syllabus.rowCount == 0) {
            // console.log("number is null");
            group_id = 1;
        }
        else {
            // console.log("number is not null");
            group_id = Number(syllabus.rows[0]["group_id"] || 0) + 1;
        };

        let option_syllabus_details1 = await client.query(`INSERT INTO public.option_syllabus_details 
            (  syllabus_title, syllabus_desc, pub_syllabus_id, syllabus_image, language_id,group_id,link_one, link_two)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) `,
            [req.body.syllabus_title_hindi, req.body.syllabus_desc_hindi, req.body.pub_syllabus_id, req.file.filename, 4, group_id, req.body.link_one, req.body.link_two])
        let option_syllabus_details2 = await client.query(`INSERT INTO public.option_syllabus_details 
            (  syllabus_title, syllabus_desc, pub_syllabus_id, syllabus_image, language_id,group_id,link_one, link_two) 
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) `,
            [req.body.syllabus_title_english, req.body.syllabus_desc_english, req.body.pub_syllabus_id, req.file.filename, 1, group_id, req.body.link_one, req.body.link_two])
        let option_syllabus_details3 = await client.query(`INSERT INTO public.option_syllabus_details 
            (  syllabus_title, syllabus_desc, pub_syllabus_id, syllabus_image, language_id,group_id,link_one, link_two)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) `,
            [req.body.syllabus_title_lit, req.body.syllabus_desc_lit, req.body.pub_syllabus_id, req.file.filename, 3, group_id, req.body.link_one, req.body.link_two])
        let option_syllabus_details4 = await client.query(`INSERT INTO public.option_syllabus_details 
            (  syllabus_title, syllabus_desc, pub_syllabus_id, syllabus_image, language_id,group_id,link_one, link_two)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) `,
            [req.body.syllabus_title_urdu, req.body.syllabus_desc_urdu, req.body.pub_syllabus_id, req.file.filename, 2, group_id, req.body.link_one, req.body.link_two])

        if (option_syllabus_details1.rowCount != 0 && option_syllabus_details2.rowCount != 0 && option_syllabus_details3.rowCount != 0 && option_syllabus_details4.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "syllabus Added successfully",
                category: "syllabus",
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Some thing went wrong",
                data: []
            });

        };
    } catch (error) {
        console.log(error.message,)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};
exports.syllabusUpdateDetails = async (req, res) => {
    try {
        let date = `${new Date().toISOString().slice(0, 10)}`;
        // const errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //     return res.status(400).json({ errors: errors.array() });
        // };
        const fs = require("fs")
        const path = require("path")
        let group_id
        let syllabus = await client.query(`select * from public.option_syllabus_details where group_id =$1`, [req.body.group_id])
        let image_path
        if (req.file || !req.file == "undefined") {
            const filePath = path.join(__dirname + "/../public/assist/", syllabus.rows[0]["syllabus_image"] || "not found");
            image_path = req.file.filename
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    console.log('File deleted successfully');
                });
            }
        } else {
            image_path = syllabus.rows[0]["syllabus_image"] || "not found"
        }

        let option_syllabus_details1 = await client.query(`UPDATE  public.option_syllabus_details 
            SET   syllabus_title=$1, syllabus_desc=$2, syllabus_image=$3 ,language_id=$4, link_one=$7, link_two=$8 WHERE  group_id=$5 AND language_id=$6 `,
            [req.body.syllabus_title_hindi, req.body.syllabus_desc_hindi, image_path, 4, req.body.group_id, 4, req.body.link_one, req.body.link_two])
        let option_syllabus_details2 = await client.query(`UPDATE  public.option_syllabus_details 
            SET   syllabus_title=$1, syllabus_desc=$2, syllabus_image=$3  ,language_id=$4, link_one=$7, link_two=$8 WHERE group_id=$5 AND  language_id=$6 `,
            [req.body.syllabus_title_english, req.body.syllabus_desc_english, image_path, 1, req.body.group_id, 1, req.body.link_one, req.body.link_two])
        let option_syllabus_details3 = await client.query(`UPDATE  public.option_syllabus_details 
            SET   syllabus_title=$1, syllabus_desc=$2, syllabus_image=$3 ,language_id=$4, link_one=$7, link_two=$8 WHERE  group_id=$5 AND language_id=$6 `,
            [req.body.syllabus_title_lit, req.body.syllabus_desc_lit, image_path, 3, req.body.group_id, 3, req.body.link_one, req.body.link_two])
        let option_syllabus_details4 = await client.query(`UPDATE  public.option_syllabus_details 
            SET   syllabus_title=$1, syllabus_desc=$2, syllabus_image=$3 ,language_id=$4, link_one=$7, link_two=$8 WHERE  group_id=$5 AND language_id=$6 `,
            [req.body.syllabus_title_urdu, req.body.syllabus_desc_urdu, image_path, 2, req.body.group_id, 2, req.body.link_one, req.body.link_two])

        if (option_syllabus_details1.rowCount != 0 && option_syllabus_details2.rowCount != 0 && option_syllabus_details3.rowCount != 0 && option_syllabus_details4.rowCount != 0) {
            res.status(200).json({
                result: true,
                message: "syllabus updated successfully",
                category: "syllabus",
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Some thing went wrong",
                data: []
            });

        };
    } catch (error) {
        console.log(error.message,)
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.syllabusListDetails = async (req, res) => {
    try {
        // query validation
        console.log(req.query)
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include group_id in query!" });
        };
        const assist = await client.query(`select group_id,json_agg(json_build_object('syllabus_details_id',syllabus_details_id	,'syllabus_title',syllabus_title,'syllabus_desc',syllabus_desc,	'pub_syllabus_id',pub_syllabus_id,'syllabus_image',syllabus_image,'language_id',language_id, 'link_one', link_one, 'link_two', link_two) order by language_id asc) as course FROM public.option_syllabus_details where  pub_syllabus_id=$1 group by group_id order by group_id asc`, [req.query.group_id]);

        if (assist.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "Successfully fetched  details!",
                data: assist.rows,
            });
        }

        return res.status(200).json({
            result: false,
            message: "Unable to fetch  details!",
            data: assist.rows,
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

exports.syllabusEditDetails = async (req, res) => {
    try {
        // query validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include group_id in query" });
        };
        const syllabus = await client.query(`SELECT * FROM option_syllabus_details WHERE group_id = $1`, [req.query.group_id])
        const obj = {}
        if (syllabus.rowCount > 0) {
            for (const el of syllabus.rows) {
                if (el.language_id == 4) {
                    obj.syllabus_title_hindi = el.syllabus_title
                    obj.course_desc_hindi = el.syllabus_desc
                    // obj.secondary_title_hindi=el.secondary_title
                }
                if (el.language_id == 3) {

                    obj.syllabus_title_lit = el.syllabus_title
                    obj.course_desc_lit = el.syllabus_desc
                    // obj.secondary_title_english=el.secondary_title
                }
                if (el.language_id == 2) {
                    obj.syllabus_title_urdu = el.syllabus_title
                    obj.course_desc_urdu = el.syllabus_desc
                    // obj.secondary_title_urdu=el.secondary_title
                }
                if (el.language_id == 1) {
                    obj.syllabus_title_english = el.syllabus_title
                    obj.course_desc_english = el.syllabus_desc
                    // obj.secondary_title_english=el.secondary_title
                }
                obj.pub_syllabus_id = syllabus.rows[0]["pub_syllabus_id"]
                obj.file = syllabus.rows[0]["syllabus_image"]
                obj.link_one = syllabus.rows[0]["link_one"];
                obj.link_two = syllabus.rows[0]["link_two"];
            }

            res.status(200).json({
                result: true,
                message: "success",
                syllabus: obj,
                syllabus_data: syllabus.rows
            });
        } else {
            res.status(200).json({
                result: false,
                message: "Database Err! data not found",
                syllabus: syllabus.rows
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

exports.syllabysDeleteDetails = async (req, res) => {
    try {
        // query validation
        // if (!req.query.group_id || req.query.group_id == '') {
        //     return res.status(400).json({ errors: "Please include group_id in query" });
        // };

        const fs = require("fs")
        const path = require("path")
        // let syllabus = await client.query(`select * from public.option_publication_syllabus where group_id =$1`, [req.body.group_id])
        let syllabus1 = await client.query(`select * from public.option_syllabus_details where group_id =$1`, [req.query.group_id])

        // if (syllabus.rows.length > 0) {
        //     const filePath = path.join(__dirname + "/../public/assist/", syllabus.rows[0]["course_img"] || "not found");
        //     if (fs.existsSync(filePath)) {
        //         fs.unlink(filePath, (err) => {
        //             if (err) throw err;
        //             console.log('File deleted successfully');
        //         });
        //     }
        // }
        if (syllabus1.rows.length > 0) {
            const filePath = path.join(__dirname + "/../public/assist/", syllabus1.rows[0]["syllabus_image"] || "not found");
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    console.log('File deleted successfully');
                });
            }
        }
        // const Assist = await client.query("DELETE FROM public.option_publication_syllabus where group_id =$1", [req.body.group_id]);
        const sy = await client.query("DELETE FROM public.option_syllabus_details where group_id =$1", [req.query.group_id]);

        if (sy.rowCount > 0 && sy.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "successfully deleted syllabus!",
                data: sy.rows
            });
        } else {

            res.status(200).json({
                result: false,
                message: "Data not found",
                data: sy.rows
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

exports.createNewAssessment = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        // query validation
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory ID in query!" });
        };

        const subcategory_id = req.query.subcategory_id;
        const jd_id = req.query.jd_id;
        const { assessment_name, assessment_desc, total_marks } = req.body;
        const created_by_id = req.user.user_id

        const insert_assessment = await client.query("INSERT INTO assessments (assessment_name,assessment_desc,total_marks,jd_id,created_by_id,subcategory_id) VALUES ($1,$2,$3,$4,$5,$6)", [assessment_name, assessment_desc, total_marks, jd_id, created_by_id, subcategory_id]);

        if (insert_assessment.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "successfully create new assessment!",
                data: insert_assessment.rows
            });
        } else {

            res.status(200).json({
                result: false,
                message: "Sorry! somthing went wrong",
                data: insert_assessment.rows
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

exports.addQuestionWithOptions = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        // query validation
        if (!req.query.assessment_id) {
            return res.status(400).json({ errors: "Please include Assessment ID in query!" });
        };

        const assessment_id = req.query.assessment_id;
        const {
            english_question, urdu_question, hindi_question, transliteration_question,
            marks,
            time_limit,
            options
        } = req.body;

        const created_by_id = req.user.user_id
        var questions_group_id = 0;
        var options_group_id = 0;
        const questions_group_id_max = await client.query("SELECT MAX(group_id) FROM assessment_questions");
        const options_group_id_max = await client.query("SELECT MAX(group_id) FROM assessment_questions_options");

        if (questions_group_id_max.rowCount > 0 && options_group_id_max.rowCount) {

            // set group id for questions
            if (questions_group_id_max.rows[0].max == null) {
                // console.log("number is null");
                questions_group_id = 1;
            }
            else {
                // console.log("number is not null");
                questions_group_id = parseInt(questions_group_id_max.rows[0].max) + 1;
            };


            // check if assessment_id is valid in assessments table
            const check_assessment_id = await client.query("SELECT EXISTS (SELECT * FROM assessments WHERE assessment_id = $1) AS it_does_exist;", [assessment_id]);

            if (check_assessment_id.rows[0].it_does_exist == true) {
                // Main insert logic

                // Get all languages
                const getLanguages = await client.query("SELECT * FROM languages");

                // if successfully fetch all languages
                if (getLanguages.rowCount > 0) {

                    var english_options_inserted = 0;
                    var urdu_options_inserted = 0;
                    var hindi_options_inserted = 0;
                    var transliteration_options_inserted = 0;

                    // set group id for options
                    if (options_group_id_max.rows[0].max == null) {
                        // console.log("number is null");
                        options_group_id = 1;
                    }
                    else {
                        // console.log("number is not null");
                        options_group_id = parseInt(options_group_id_max.rows[0].max) + 1;
                    };

                    for (const langObj of getLanguages.rows) {


                        if (langObj.language == "English") {
                            var insert_english_question = await client.query("INSERT INTO assessment_questions (question,marks,time_limit,created_by_id,assessment_id,group_id,language_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING question_id", [english_question, marks, time_limit, created_by_id, assessment_id, questions_group_id, langObj.language_id]);

                            // Add all english options
                            for (const option of options) {
                                if (insert_english_question.rowCount > 0) {
                                    let question_id = insert_english_question.rows[0].question_id
                                    let insert_english_option = await client.query("INSERT INTO assessment_questions_options (option,is_answer,created_by_id,question_id,group_id,language_id) VALUES ($1,$2,$3,$4,$5,$6)", [option.english_option, option.is_answer, created_by_id, question_id, options_group_id, langObj.language_id]);
                                    if (insert_english_option.rowCount > 0) {
                                        english_options_inserted++
                                    };
                                }
                            }


                        } else if (langObj.language == "Urdu") {
                            var insert_urdu_question = await client.query("INSERT INTO assessment_questions (question,marks,time_limit,created_by_id,assessment_id,group_id,language_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING question_id", [urdu_question, marks, time_limit, created_by_id, assessment_id, questions_group_id, langObj.language_id]);

                            // Add all urdu options
                            for (const option of options) {
                                if (insert_urdu_question.rowCount > 0) {
                                    let question_id = insert_urdu_question.rows[0].question_id
                                    let insert_urdu_option = await client.query("INSERT INTO assessment_questions_options (option,is_answer,created_by_id,question_id,group_id,language_id) VALUES ($1,$2,$3,$4,$5,$6)", [option.urdu_option, option.is_answer, created_by_id, question_id, options_group_id, langObj.language_id]);
                                    if (insert_urdu_option.rowCount > 0) {
                                        urdu_options_inserted++
                                    };
                                }
                            }


                        } else if (langObj.language == "English - Transliteration") {
                            var insert_transliteration_question = await client.query("INSERT INTO assessment_questions (question,marks,time_limit,created_by_id,assessment_id,group_id,language_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING question_id", [transliteration_question, marks, time_limit, created_by_id, assessment_id, questions_group_id, langObj.language_id]);
                            // Add all transliteration options
                            for (const option of options) {
                                if (insert_transliteration_question.rowCount > 0) {
                                    let question_id = insert_transliteration_question.rows[0].question_id
                                    let insert_transliteration_option = await client.query("INSERT INTO assessment_questions_options (option,is_answer,created_by_id,question_id,group_id,language_id) VALUES ($1,$2,$3,$4,$5,$6)", [option.transliteration_option, option.is_answer, created_by_id, question_id, options_group_id, langObj.language_id]);
                                    if (insert_transliteration_option.rowCount > 0) {
                                        transliteration_options_inserted++
                                    };
                                }
                            }


                        } else if (langObj.language == "Hindi") {
                            var insert_hindi_question = await client.query("INSERT INTO assessment_questions (question,marks,time_limit,created_by_id,assessment_id,group_id,language_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING question_id", [hindi_question, marks, time_limit, created_by_id, assessment_id, questions_group_id, langObj.language_id]);
                            // Add all hindi options
                            for (const option of options) {
                                if (insert_hindi_question.rowCount > 0) {
                                    let question_id = insert_hindi_question.rows[0].question_id
                                    let insert_hindi_option = await client.query("INSERT INTO assessment_questions_options (option,is_answer,created_by_id,question_id,group_id,language_id) VALUES ($1,$2,$3,$4,$5,$6)", [option.hindi_option, option.is_answer, created_by_id, question_id, options_group_id, langObj.language_id]);
                                    if (insert_hindi_option.rowCount > 0) {
                                        hindi_options_inserted++
                                    };
                                }
                            }
                        };

                    };

                    // if all insertion enrtries is done successfully
                    if (insert_english_question.rowCount > 0 &&
                        insert_urdu_question.rowCount > 0 &&
                        insert_transliteration_question.rowCount > 0 &&
                        insert_hindi_question.rowCount > 0) {

                        if (english_options_inserted == 4 &&
                            urdu_options_inserted == 4 &&
                            hindi_options_inserted == 4 &&
                            transliteration_options_inserted == 4) {

                            return res.status(200).json({
                                result: true,
                                message: "Successfully added all questions with options",
                            });
                        }

                    } else {
                        return res.status(500).json({
                            result: false,
                            message: "Sorry! Couldn't add question",
                            data: null
                        });
                    };

                } else {
                    return res.status(500).json({
                        result: false,
                        message: "Database Error in languages table",
                        data: getLanguages
                    });
                };



            } else {
                return res.status(500).json({
                    result: false,
                    message: "assessment_id does not exist in assessment table!",
                    data: null
                });
            }


        } else {
            return res.status(500).json({
                result: false,
                message: "Database error",
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

// Get Assessment - R
exports.getAssessment = async (req, res) => {
    try {
        // query validation
        if (!req.query.subcategory_id || req.query.subcategory_id == '') {
            return res.status(400).json({ errors: "Please include subcategory ID in query!" });
        };

        const subcategory_id = req.query.subcategory_id;
        var jd_id = null;
        var assessment_details = [];

        // If subcategory is Maktab
        if (subcategory_id == 2 || subcategory_id == 5) {
            // query validation
            if (!req.query.jd_id && !req.query.school_workshop_ten_step_id && !req.query.workshop_ten_step_id) {
                return res.status(400).json({ errors: "Pls pass all mandatory params in payload!" });
            }
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
                // Create a map to store groups by group_id
                const groupMap = new Map();
                assessment_questions.rows.forEach(question => {
                    const groupId = question.group_id;
                    if (!groupMap.has(groupId)) {
                        // Create a new group entry if it doesn't exist
                        groupMap.set(groupId, {
                            group_id: groupId,
                            group: []
                        });
                    }
                    // Add the question to the respective group
                    groupMap.get(groupId).group.push({
                        question_id: question.question_id,
                        assessment_id: question.assessment_id,
                        question: question.question,
                        marks: question.marks,
                        created_by_id: question.created_by_id,
                        created_on: question.created_on,
                        modified_by_id: question.modified_by_id,
                        modified_on: question.modified_on,
                        time_limit: question.time_limit,
                        language_id: question.language_id,
                        options: question.options
                    });
                });
                // Convert the map values to an array
                const finalOutput = {
                    assessment_questions: Array.from(groupMap.values())
                };

                return res.status(200).json({
                    result: true,
                    message: "Successfully get assessment all data!",
                    data: {
                        assessment_details: assessment_details.rows[0],
                        assessment_questions: finalOutput,
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

// Edit Assessments - E
exports.editAssessmentDetails = async (req, res) => {
    try {
        // query validation
        if (!req.query.assessment_id || req.query.assessment_id == '') {
            return res.status(400).json({ errors: "Please include Assessment ID in query!" });
        };

        const assessment_id = req.query.assessment_id;

        const assessment_details = await client.query("SELECT * FROM assessments WHERE assessment_id=$1", [assessment_id]);

        if (assessment_details.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "Successfully fetch assessment details!",
                data: assessment_details.rows[0],
            });
        }

        return res.status(200).json({
            result: false,
            message: "Unable to fetch assessment details!",
            data: assessment_details.rows[0],
        });


    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

// Edit Assessments QuestionWithOptions- E
exports.editQuestionWithOptions = async (req, res) => {
    try {
        // query validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include Question ID in query!" });
        };

        const group_id = req.query.group_id;

        const question_details = await client.query("SELECT * FROM assessment_questions WHERE group_id=$1 ORDER BY language_id ASC", [group_id]);



        // console.log("question_details",question_details.rows);

        // const option_details = await client.query("SELECT * FROM assessment_questions_options WHERE question_id=$1", [question_id]);

        if (question_details.rowCount > 0) {

            for (let i = 0; i < question_details.rows.length; i++) {
                let question = question_details.rows[i];
                let assessment_questions_options = await client.query("SELECT * FROM assessment_questions_options WHERE question_id=$1 ORDER BY language_id ASC", [question.question_id])
                if (assessment_questions_options.rowCount > 0) {

                    let options = assessment_questions_options.rows.filter(option => option.question_id == question.question_id);
                    question_details.rows[i].options = options
                }
            }

            return res.status(200).json({
                result: true,
                message: "Successfully fetch assessment question with options!",
                // data: {
                //     ...question_details.rows[0],
                //     options: option_details.rows
                // }
                data: question_details.rows
            })
        }

        return res.status(200).json({
            result: false,
            message: "Unable to fetch assessment question with options!",
            data: [],
        });


    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

// Delete assessment - D
exports.deleteAssessment = async (req, res) => {
    try {
        // query validation
        if (!req.query.assessment_id || req.query.assessment_id == '') {
            return res.status(400).json({ errors: "Please include Assessment ID in query!" });
        };

        const assessment_id = req.query.assessment_id;
        const deleteAssessment = await client.query("DELETE FROM assessments WHERE assessment_id=$1", [assessment_id]);

        if (deleteAssessment.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "Successfully delete assessment!",
            })
        }
        return res.status(200).json({
            result: false,
            message: "Unable to delete assessment!",
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
}

// Delete assessment questionWithOptions - D
exports.deleteQuestionWithOptions = async (req, res) => {
    try {
        // query validation
        if (!req.query.group_id || req.query.group_id == '') {
            return res.status(400).json({ errors: "Please include Group ID in query!" });
        };

        const group_id = req.query.group_id;

        const deleteQuestionWithOpt = await client.query("DELETE FROM assessment_questions WHERE group_id=$1", [group_id])

        if (deleteQuestionWithOpt.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "Successfully delete question with options!",
            })
        }

        return res.status(200).json({
            result: false,
            message: "Unable to delete question with options!",
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
}

// Update Assessments Details - U
exports.updateAssessmentDetails = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };
        // query validation
        if (!req.query.assessment_id || req.query.assessment_id == '') {
            return res.status(400).json({ errors: "Please include Assessment ID in query!" });
        };

        const { assessment_name, assessment_desc, total_marks } = req.body;
        const modified_by_id = req.user.user_id;
        const assessment_id = req.query.assessment_id;
        const modified_on = moment().format();

        const update_assessment_details = await client.query("UPDATE assessments SET assessment_name=$1, assessment_desc=$2, total_marks=$3, modified_by_id=$4, modified_on=$5 WHERE assessment_id=$6", [assessment_name, assessment_desc, total_marks, modified_by_id, modified_on, assessment_id])

        if (update_assessment_details.rowCount > 0) {
            return res.status(200).json({
                result: true,
                message: "successfully updated assessment details!",
            });
        }

        return res.status(200).json({
            result: false,
            message: "Sorry! somthing went wrong while updating assessment details.",
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

// Update Assessments Question with options - U
// exports.updateQuestionWithOptions = async (req, res) => {
//     try {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         };

//         const assessment_questions = req.body
//         const modified_by_id = req.user.user_id;
//         const modified_on = moment().format();



//         // Get all languages
//         const getLanguages = await client.query("SELECT * FROM languages");

//         var english_options_updated = 0
//         var hindi_options_updated = 0
//         var urdu_options_updated = 0
//         var transliteration_options_updated = 0
//         for (const langObj of getLanguages.rows) {

//             if (langObj.language == "English") {

//                 var update_english_question = await client.query("UPDATE assessment_questions SET question=$1, modified_by_id=$2, modified_on=$3 WHERE group_id=$4 AND language_id=$5",[assessment_questions.english_question,modified_by_id,modified_on,assessment_questions.group_id,langObj.language_id]);

//                 if(update_english_question.rowCount > 0){

//                     // Update all english options
//                     for (let option of assessment_questions.options) {

//                         var update_english_option = await client.query("UPDATE assessment_questions_options SET option=$1, is_answer=$2, modified_by_id=$3, modified_on=$4 WHERE option_id=$5",[option.english_option,option.is_answer,modified_by_id,modified_on,option.option_id[0]]);

//                         if(update_english_option.rowCount > 0){
//                             english_options_updated++
//                         };
//                     }
//                 }

//             }
//             else if(langObj.language == "Urdu"){

//                 var update_urdu_question = await client.query("UPDATE assessment_questions SET question=$1, modified_by_id=$2, modified_on=$3 WHERE group_id=$4 AND language_id=$5",[assessment_questions.urdu_question,modified_by_id,modified_on,assessment_questions.group_id,langObj.language_id]);

//                 if(update_urdu_question.rowCount > 0){

//                     // Update all Urdu options
//                     for (let option of assessment_questions.options) {

//                         var update_urdu_option = await client.query("UPDATE assessment_questions_options SET option=$1, is_answer=$2, modified_by_id=$3, modified_on=$4 WHERE option_id=$5",[option.urdu_option,option.is_answer,modified_by_id,modified_on,option.option_id[1]]);

//                         if(update_urdu_option.rowCount > 0){
//                             urdu_options_updated++
//                         };
//                     }
//                 }
//             } 
//             else if (langObj.language == "Hindi") {

//                 var update_hindi_question = await client.query("UPDATE assessment_questions SET question=$1, modified_by_id=$2, modified_on=$3 WHERE group_id=$4 AND language_id=$5",[assessment_questions.hindi_question,modified_by_id,modified_on,assessment_questions.group_id,langObj.language_id]);

//                 if(update_hindi_question.rowCount > 0){

//                     // Update all Hindi options
//                     for (let option of assessment_questions.options) {

//                         var update_hindi_option = await client.query("UPDATE assessment_questions_options SET option=$1, is_answer=$2, modified_by_id=$3, modified_on=$4 WHERE option_id=$5",[option.hindi_option,option.is_answer,modified_by_id,modified_on,option.option_id[2]]);

//                         if(update_hindi_option.rowCount > 0){
//                             hindi_options_updated++
//                         };
//                     }
//                 }

//             }
//             else if (langObj.language == "English - Transliteration") {

//                 var update_transliteration_question = await client.query("UPDATE assessment_questions SET question=$1, modified_by_id=$2, modified_on=$3 WHERE group_id=$4 AND language_id=$5",[assessment_questions.transliteration_question,modified_by_id,modified_on,assessment_questions.group_id,langObj.language_id]);

//                 if(update_transliteration_question.rowCount > 0){

//                     // Update all Transliteration options
//                     for (let option of assessment_questions.options) {

//                         var update_transliteration_option = await client.query("UPDATE assessment_questions_options SET option=$1, is_answer=$2, modified_by_id=$3, modified_on=$4 WHERE option_id=$5",[option.transliteration_option,option.is_answer,modified_by_id,modified_on,option.option_id[3]]);

//                         if(update_transliteration_option.rowCount > 0){
//                             transliteration_options_updated++
//                         };
//                     }
//                 }
//             }

//         }


//         // console.log("english_options_updated",english_options_updated);
//         // console.log("urdu_options_updated",urdu_options_updated);
//         // console.log("hindi_options_updated",hindi_options_updated);
//         // console.log("transliteration_options_updated",transliteration_options_updated);

//         if(english_options_updated == 4 &&
//             urdu_options_updated == 4 &&
//             hindi_options_updated == 4 &&
//             transliteration_options_updated == 4 ){

//             return res.status(200).json({
//                 result: true,
//                 message: "Successfully Updated all questions with options",
//             });
//         }else {
//             return res.status(500).json({
//                 result: false,
//                 message: "Sorry! Couldn't Update question",
//                 data: null
//             });
//         };




//     } catch (error) {
//         res.status(error.statusCode || 500).json({
//             result: false,
//             message: error.message,
//             data: null
//         });
//     };
// };


// Add QuestionsWithOptions - C
exports.updateQuestionWithOptions = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        let {
            english_question, urdu_question, hindi_question, transliteration_question,
            marks,
            time_limit,
            options,
            group_id,
            assessment_id = parseInt(assessment_id)

        } = req.body;


        // DELETE PREVIOUS
        const deleteQuestionWithOpt = await client.query("DELETE FROM assessment_questions WHERE group_id=$1", [group_id])

        if (deleteQuestionWithOpt.rowCount > 0) {



            // ADD NEW
            const modified_by_id = req.user.user_id
            const created_by_id = req.user.user_id
            const modified_on = moment().format();
            var questions_group_id = 0;
            var options_group_id = 0;
            const questions_group_id_max = await client.query("SELECT MAX(group_id) FROM assessment_questions");
            const options_group_id_max = await client.query("SELECT MAX(group_id) FROM assessment_questions_options");

            if (questions_group_id_max.rowCount > 0 && options_group_id_max.rowCount) {

                // set group id for questions
                if (questions_group_id_max.rows[0].max == null) {
                    // console.log("number is null");
                    questions_group_id = 1;
                }
                else {
                    // console.log("number is not null");
                    questions_group_id = parseInt(questions_group_id_max.rows[0].max) + 1;
                };


                // check if assessment_id is valid in assessments table
                const check_assessment_id = await client.query("SELECT EXISTS (SELECT * FROM assessments WHERE assessment_id = $1) AS it_does_exist;", [assessment_id]);

                if (check_assessment_id.rows[0].it_does_exist == true) {
                    // Main insert logic

                    // Get all languages
                    const getLanguages = await client.query("SELECT * FROM languages");

                    // if successfully fetch all languages
                    if (getLanguages.rowCount > 0) {

                        var english_options_inserted = 0;
                        var urdu_options_inserted = 0;
                        var hindi_options_inserted = 0;
                        var transliteration_options_inserted = 0;

                        // set group id for options
                        if (options_group_id_max.rows[0].max == null) {
                            // console.log("number is null");
                            options_group_id = 1;
                        }
                        else {
                            // console.log("number is not null");
                            options_group_id = parseInt(options_group_id_max.rows[0].max) + 1;
                        };

                        for (const langObj of getLanguages.rows) {


                            if (langObj.language == "English") {
                                var insert_english_question = await client.query("INSERT INTO assessment_questions (question,marks,time_limit,created_by_id,modified_by_id,assessment_id,group_id,language_id,modified_on) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING question_id", [english_question, marks, time_limit, created_by_id, modified_by_id, assessment_id, questions_group_id, langObj.language_id, modified_on]);

                                // Add all english options
                                for (const option of options) {
                                    if (insert_english_question.rowCount > 0) {
                                        let question_id = insert_english_question.rows[0].question_id
                                        let insert_english_option = await client.query("INSERT INTO assessment_questions_options (option,is_answer,created_by_id,modified_by_id,question_id,group_id,language_id,modified_on) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [option.english_option, option.is_answer, created_by_id, modified_by_id, question_id, options_group_id, langObj.language_id, modified_on]);
                                        if (insert_english_option.rowCount > 0) {
                                            english_options_inserted++
                                        };
                                    }
                                }


                            } else if (langObj.language == "Urdu") {
                                var insert_urdu_question = await client.query("INSERT INTO assessment_questions (question,marks,time_limit,created_by_id,modified_by_id,assessment_id,group_id,language_id,modified_on) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING question_id", [urdu_question, marks, time_limit, created_by_id, modified_by_id, assessment_id, questions_group_id, langObj.language_id, modified_on]);

                                // Add all urdu options
                                for (const option of options) {
                                    if (insert_urdu_question.rowCount > 0) {
                                        let question_id = insert_urdu_question.rows[0].question_id
                                        let insert_urdu_option = await client.query("INSERT INTO assessment_questions_options (option,is_answer,created_by_id,modified_by_id,question_id,group_id,language_id,modified_on) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [option.urdu_option, option.is_answer, created_by_id, modified_by_id, question_id, options_group_id, langObj.language_id, modified_on]);
                                        if (insert_urdu_option.rowCount > 0) {
                                            urdu_options_inserted++
                                        };
                                    }
                                }


                            } else if (langObj.language == "English - Transliteration") {
                                var insert_transliteration_question = await client.query("INSERT INTO assessment_questions (question,marks,time_limit,created_by_id,modified_by_id,assessment_id,group_id,language_id,modified_on) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING question_id", [transliteration_question, marks, time_limit, created_by_id, modified_by_id, assessment_id, questions_group_id, langObj.language_id, modified_on]);
                                // Add all transliteration options
                                for (const option of options) {
                                    if (insert_transliteration_question.rowCount > 0) {
                                        let question_id = insert_transliteration_question.rows[0].question_id
                                        let insert_transliteration_option = await client.query("INSERT INTO assessment_questions_options (option,is_answer,created_by_id,modified_by_id,question_id,group_id,language_id,modified_on) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [option.transliteration_option, option.is_answer, created_by_id, modified_by_id, question_id, options_group_id, langObj.language_id, modified_on]);
                                        if (insert_transliteration_option.rowCount > 0) {
                                            transliteration_options_inserted++
                                        };
                                    }
                                }


                            } else if (langObj.language == "Hindi") {
                                var insert_hindi_question = await client.query("INSERT INTO assessment_questions (question,marks,time_limit,created_by_id,modified_by_id,assessment_id,group_id,language_id,modified_on) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING question_id", [hindi_question, marks, time_limit, created_by_id, modified_by_id, assessment_id, questions_group_id, langObj.language_id, modified_on]);
                                // Add all hindi options
                                for (const option of options) {
                                    if (insert_hindi_question.rowCount > 0) {
                                        let question_id = insert_hindi_question.rows[0].question_id
                                        let insert_hindi_option = await client.query("INSERT INTO assessment_questions_options (option,is_answer,created_by_id,modified_by_id,question_id,group_id,language_id,modified_on) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [option.hindi_option, option.is_answer, created_by_id, modified_by_id, question_id, options_group_id, langObj.language_id, modified_on]);
                                        if (insert_hindi_option.rowCount > 0) {
                                            hindi_options_inserted++
                                        };
                                    }
                                }
                            };

                        };

                        // if all insertion enrtries is done successfully
                        if (insert_english_question.rowCount > 0 &&
                            insert_urdu_question.rowCount > 0 &&
                            insert_transliteration_question.rowCount > 0 &&
                            insert_hindi_question.rowCount > 0) {

                            if (english_options_inserted == 4 &&
                                urdu_options_inserted == 4 &&
                                hindi_options_inserted == 4 &&
                                transliteration_options_inserted == 4) {

                                return res.status(200).json({
                                    result: true,
                                    message: "Successfully deleted and updated all questions with options",
                                });
                            }

                        } else {
                            return res.status(500).json({
                                result: false,
                                message: "Sorry! Couldn't deleted and updated question",
                                data: null
                            });
                        };

                    } else {
                        return res.status(500).json({
                            result: false,
                            message: "Database Error in languages table",
                            data: getLanguages
                        });
                    };



                } else {
                    return res.status(500).json({
                        result: false,
                        message: "assessment_id does not exist in assessment table!",
                        data: null
                    });
                }


            } else {
                return res.status(500).json({
                    result: false,
                    message: "Database error",
                    data: null
                });
            }


        }
    } catch (error) {
        res.status(error.statusCode || 500).json({
            result: false,
            message: error.message,
            data: null
        });
    };
};

const dailyPostNotification = async (req) => {
    const payload = {
        notification: {
            // for all devices 
            title: "Daily Post",
            body: "Islamic Messages, Deen Seekhna Sikhana & more"
        },
        data: {
            title: "Daily Post",
            body: "Islamic Messages, Deen Seekhna Sikhana & more",
            posts: "" + req.postData + ""
        },
        android: {
            notification: {
                // for android devices
                event_time: new Date().toISOString(),
                notification_priority: "PRIORITY_HIGH",
                color: '#007500'
            },
            priority: "HIGH"
        },
        topic: "daily_post"
    };
    getMessaging().send(payload)
        .then((response) => {
            console.log('Daily Post notification sent successfully:', response);
            return "Daily Post notification sent successfully";
        })
        .catch((error) => { console.error('Error sending Daily Post notification:', error); });
}

getPostDatesQuery = async (req, res) => {
    try {


        var getPostDatesQuery = "SELECT group_id, date, json_agg(json_build_object('language_id',language_id,'message',message,'reference',reference) order by language_id) as post_data, json_agg(json_build_object('language_id',language_id,'message',message,'reference',reference,'date',date,'dp_id',dp_id) order by language_id) as details FROM public.daily_posts group by group_id, date order by date asc";
        let getPostDatesQuery_result = await client.query(getPostDatesQuery);

        const now = new Date();
        const options = { calendar: "islamic", year: "numeric" };
        let hijriYear = new Intl.DateTimeFormat("en-US-u-ca-islamic", options).format(now);
        hijriYear = parseInt(hijriYear.slice(0, 4), 10);
        console.log("Current Hijri Year:", hijriYear);

        for (const postDate of getPostDatesQuery_result.rows) {
            var notifDate = postDate.details[0].date;
            notifDate = new Date(notifDate);

            let day = notifDate.getUTCDate();
            let month = notifDate.getUTCMonth() + 1; // Adding 1 because getUTCMonth() returns zero-based index (0 for January)
            let year = notifDate.getUTCFullYear();
            // console.log('>>> Hijri', day, month)

            let gregDate = await hijriToCalendars(hijriYear, month, day);
            if (!gregDate) { continue; }
            let date = gregDate.getUTCDate();
            let postMonth = gregDate.getUTCMonth() + 1;
            year = gregDate.getUTCFullYear();

            // console.log('>>> Gregorian', date, postMonth, year);
            cron.schedule(`35 17 ${date} ${postMonth} *`, function () {
                var req = {
                    postData: postDate.post_data[0]
                }
                dailyPostNotification(req);
            });
        }
    } catch (error) {
        console.log(error);
    }
};

getPostDatesQuery();