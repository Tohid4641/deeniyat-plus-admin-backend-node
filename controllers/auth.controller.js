const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const  jwt  =  require("jsonwebtoken");
const client = require('../configs/db.config');

// REGISTER
exports.register = async(req, res) => {
    try {

        // finds the validation errors in this request and wraps them in an object with handy functions
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        // require inputs
        const { user_name, mail_id, password } =  req.body;
        var  flag  =  0; // declaring a flag for user insertion

        // checking if user already exists
        const userData = await client.query(`SELECT * FROM public.users WHERE mail_id= $1;`, [mail_id]);

        if (userData.rows.length  !=  0) {
            return  res.status(400).json({error: "Email already there, No need to register again."});
        };

        // generate new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        
        // inserting data into the database
        const insertedUserData = await client.query(`INSERT INTO public.users (user_name, mail_id, password) VALUES ($1,$2,$3) RETURNING user_id;`, [user_name, mail_id,hashedPassword]);
        if(!insertedUserData){
            flag = 0;
            console.error(err);
            return  res.status(500).json({error: "Database error", flag});
        }

        flag  =  1;

        res.status(200).json({
            result:true,
            message: 'User added to database, not verified',
            data:{user_id:insertedUserData.rows[0].user_id, flag}
        });

    } catch (error) {
        res.status( error.statusCode || 500 ).json({
            result:false,
            message:error.message,
            data:null
        });
    };
};

// LOGIN
// exports.login = async(req, res) => {
//     try {

//         // finds the validation errors in this request and wraps them in an object with handy functions
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         };

//         // checking if user already exists
//         const userData = await client.query(`SELECT * FROM public.users WHERE mail_id= $1;`, [req.body.mail_id]);
//         if (userData.rows.length  ==  0) {
//             return  res.status(400).json({error: "User is not registered, Sign Up first"});
//         };

//         // get user data
//         const { password, ...otherData } = userData.rows[0];

//         // compare password
//         const validPassword = await bcrypt.compare(req.body.password, password);
//         if(!validPassword){
//             return res.status(400).json({error:"Invalid credentials"});
//         };

      
//         // if user login one and more systems then we will check is_active status (one-to-many relation)
//         if (otherData.is_active	== true) {

//             let getToken = await client.query(`SELECT token FROM public.users_session WHERE user_id= $1;`,[otherData.user_id]);

//             // find token expiry
//             const decoded = jwt.verify(getToken.rows[0].token, process.env.SECRET_KEY);
//             let exp = decoded.exp * 1000;

//             // set token and expiry time in cookies
//             res.cookie("session_token", getToken.rows[0].token , {expire : new Date(exp)});

//             res.status(200).json({
//                 result:true,
//                 message: "User signed in!",
//                 data:{...otherData}
//             });  

//         } 
//         // if user login first time then create token
//         else {

//             // update active status in users table
//             let updateActiveStatus = await client.query(`UPDATE public.users SET is_active='true' WHERE user_id=$1`,[otherData.user_id]);

//             let getToken = await client.query(`SELECT token FROM public.users_session WHERE user_id= $1;`,[otherData.user_id]);

//             if(getToken.rows[0].token == null || !getToken){
//                 const token = jwt.sign(
//                     {...otherData},
//                     process.env.SECRET_KEY,
//                     {expiresIn:60}
//                 ); // 1-month valid time expiresIn:2592000

//                 // token insert into session table
//                 let insertToken = await client.query(`INSERT INTO public.users_session (user_id,token) VALUES ($1,$2)`,[otherData.user_id, token]);

//                 // set cookie and expire in 1 month
//                 res.cookie("session_token", token, {expire : new Date(Date.now() + (30*24*3600000)) });
        
//                 return res.status(200).json({
//                     result:true,
//                     message: "User signed in!",
//                     data:{...otherData }
//                 });  
//             }

//             // find token expiry
//             const decoded = jwt.verify(getToken.rows[0].token, process.env.SECRET_KEY);
//             let exp = decoded.exp * 1000;

//             // set token and expiry time in cookies
//             res.cookie("session_token", getToken.rows[0].token , {expire : new Date(exp)});
        
//             res.status(200).json({
//                 result:true,
//                 message: "User signed in!",
//                 data:{...otherData }
//             });  
//         }
  
//     } catch (error) {
//         res.status( error.statusCode || 500 ).json({
//             result:false,
//             message:error.message,
//             data:null
//         });
//     };
// };

// LOGOUT
// exports.logout = async(req, res) => {
//     try {

//         if(!req.params.user_id || req.params.user_id == ''){
//             return res.status(400).json({ errors: 'Please include a current user id for logout' });
//         }

//         const user_id = req.params.user_id;
//         const decoded = req.user;

//         // if token expire
//         if(decoded == {} || !decoded.iat){
//             let emptyToken = await client.query(`UPDATE public.users_session SET token=null WHERE user_id=$1`,[user_id]);
//         };

//         // update active status in users table
//         let updateActiveStatus = await client.query(`UPDATE public.users SET is_active='false' WHERE user_id=$1`,[user_id]);

//         res.cookie("session_token", "");
        
//         res.status(200).json({
//             result:true,
//             message: "User logout!",
//             data:{}
//         }); 
//     } catch (error) {
//         res.status( error.statusCode || 500 ).json({
//             result:false,
//             message:error.message,
//             data:null
//         });
//     }
// }


// LOGIN
exports.loginOld = async(req, res) => {
    try {

        // finds the validation errors in this request and wraps them in an object with handy functions
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        // checking if user already exists
        const userData = await client.query(`SELECT * FROM public.users WHERE mail_id= $1;`, [req.body.mail_id]);
        if (userData.rows.length  ==  0) {
            return  res.status(400).json({error: "User is not registered, Sign Up first"});
        };

        // get user data
        const { password, ...otherData } = userData.rows[0];

        // console.log("userData --> ",userData.rows[0])

        // compare password
        const validPassword = await bcrypt.compare(req.body.password, password);
        if(!validPassword){
            return res.status(400).json({error:"Invalid credentials"});
        };

        const accessToken = jwt.sign(
            {...otherData},
            process.env.SECRET_KEY,
            { expiresIn: "1d" }
        );

      
        // if user login one and more systems then we will check is_active status (one-to-many relation)
        if (otherData.is_active	== true) {

            return res.status(200).json({
                result:true,
                message: "You are already signed in!",
                data:{...otherData}
            });  
        }else{
            // update active status in users table
            let updateActiveStatus = await client.query(`UPDATE public.users SET is_active='true' WHERE user_id=$1`,[otherData.user_id]);

            let getToken = await client.query(`SELECT access_token FROM public.users_session WHERE user_id= $1;`,[otherData.user_id]);
            // console.log("getToken",getToken)

            if(getToken.rowCount == 0 ){

                // token insert into session table
                let insertToken = await client.query(`INSERT INTO public.users_session (user_id,access_token) VALUES ($1,$2)`,[otherData.user_id, accessToken]);

                console.log("insertToken", insertToken);

                return res.status(200).json({
                    result:true,
                    message: "User signed in!",
                    data:{...otherData,is_active:true, accessToken }
                });
            }else{
                // token update into session table
                let updateToken = await client.query(`UPDATE public.users_session SET access_token=$1 WHERE user_id= $2;`,[accessToken, otherData.user_id]);

                console.log("updateToken", updateToken);

                return res.status(200).json({
                    result:true,
                    message: "User signed in!",
                    data:{...otherData,is_active:true, accessToken }
                });
            };
        };
  
    } catch (error) {
        res.status( error.statusCode || 500 ).json({
            result:false,
            message:error.message,
            data:null
        });
    };
};
exports.login = async(req, res) => {
    try {

        // finds the validation errors in this request and wraps them in an object with handy functions
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        // checking if user already exists
        const userData = await client.query(`SELECT * FROM public.users WHERE mail_id= $1;`, [req.body.mail_id]);
        if (userData.rows.length  ==  0) {
            return  res.status(400).json({error: "User is not registered, Sign Up first"});
        };

        // get user data
        const { password, ...otherData } = userData.rows[0];

        // console.log("userData --> ",userData.rows[0])

        // compare password
        const validPassword = await bcrypt.compare(req.body.password, password);
        if(!validPassword){
            return res.status(400).json({error:"Invalid credentials"});
        };

        const accessToken = jwt.sign(
            {...otherData},
            process.env.SECRET_KEY,
            { expiresIn: "1d" }
        );

      
        // if user login one and more systems then we will check is_active status (one-to-many relation)
        if (otherData.is_active	== false) {
            // update active status in users table
            let updateActiveStatus = await client.query(`UPDATE public.users SET is_active='true' WHERE user_id=$1`,[otherData.user_id]);
        };

        let getToken = await client.query(`SELECT access_token FROM public.users_session WHERE user_id= $1;`,[otherData.user_id]);
        // console.log("getToken",getToken)

        if(getToken.rowCount == 0 ){

            // token insert into session table
            let insertToken = await client.query(`INSERT INTO public.users_session (user_id,access_token) VALUES ($1,$2)`,[otherData.user_id, accessToken]);

            console.log("insertToken", insertToken);

            return res.status(200).json({
                result:true,
                message: "User signed in!",
                data:{...otherData,is_active:true, accessToken }
            });
        }else{
            // token update into session table
            let updateToken = await client.query(`UPDATE public.users_session SET access_token=$1 WHERE user_id= $2;`,[accessToken, otherData.user_id]);

            console.log("updateToken", updateToken);

            return res.status(200).json({
                result:true,
                message: "User signed in!",
                data:{...otherData,is_active:true, accessToken }
            });
        };
  
    } catch (error) {
        res.status( error.statusCode || 500 ).json({
            result:false,
            message:error.message,
            data:null
        });
    };
};


// LOGOUT
exports.logout = async(req, res) => {
    try {

        if(!req.params.user_id || req.params.user_id == ''){
            return res.status(400).json({ errors: 'Please include a current user id for logout' });
        }

        const user_id = req.params.user_id;

        let activeStatus = await client.query(`SELECT * FROM public.users WHERE user_id=$1`,[user_id]);

        // console.log("activeStatus", activeStatus);

        if(activeStatus.rowCount == 0 ){    // wrong userID
            return res.status(200).json({
                result:false,
                message: "Wrong UserID!",
                data:{}
            }); 
        }else if(activeStatus.rows[0].is_active == false){  // Already logout
            return res.status(200).json({
                result:false,
                message: "User already logout!",
                data:{}
            }); 
        }

        // update active status in users table
        let updateActiveStatus = await client.query(`UPDATE public.users SET is_active='false' WHERE user_id=$1`,[user_id]);

        // console.log("updateActiveStatus", updateActiveStatus);

        const {password, ...otherUserData} = activeStatus.rows[0]

        if(updateActiveStatus.rowCount > 0){

            return res.status(200).json({
                result:true,
                message: "User logout!",
                data:{...otherUserData,is_active:false}
            }); 
        }
        
    } catch (error) {
        res.status( error.statusCode || 500 ).json({
            result:false,
            message:error.message,
            data:null
        });
    }
}
