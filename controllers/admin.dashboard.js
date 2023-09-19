const { validationResult } = require("express-validator");
const client = require("../configs/db.config");
const admin = require('firebase-admin');
var propertyId = process.env.PROPERTY_ID;

const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY,
  },
});
// a function for report
const getData = async (req) => {
  const [data] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{
      startDate: '2023-01-01',
      endDate: 'today',
    }],
    dimensions: req.dimensions,
    metrics: req.metrics
  });
  return data;
}

exports.dashboardGoogleAnalytic = async (req, res) => {
  try {
    let netDataArgs = {
      dimensions: [],
      metrics: [{ name: 'totalUsers' },
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: "userEngagementDuration" }],
    }
    let netData = await getData(netDataArgs);

    let newVsReturningArgs = {
      dimensions: [
        { name: 'newVsReturning' }
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'activeUsers' },
        { name: 'newUsers' }
      ],
    };
    let newVsReturning = await getData(newVsReturningArgs);

    let countryArgs = {
      dimensions: [
        { name: "country" }
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'activeUsers' },
        { name: 'newUsers' }
      ],
    };
    let country = await getData(countryArgs);

    let osArgs = {
      dimensions: [
        { name: "operatingSystem" },
        { name: "operatingSystemVersion" }
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'activeUsers' },
        { name: 'newUsers' }
      ]
    };
    let os = await getData(osArgs);

    if (netData.rowCount <= 0) { throw { message: "No data Found!" } }

    var countries = [{ totalCountries: country.rowCount }];
    for (let i = 0; i < country.rowCount; i++) {
      var details = {
        countryName: country.rows[i].dimensionValues[0].value,
        totalUsers: country.rows[i].metricValues[0].value
      };
      countries.push(details);
    }

    var operatingSystem = [];
    for (let i = 0; i < os.rowCount; i++) {
      let details = {
        osName: os.rows[i].dimensionValues[0].value,
        osVersion: os.rows[i].dimensionValues[1].value,
        totalUsers: os.rows[i].metricValues[0].value
      };
      operatingSystem.push(details);
    }

    var data = [];
    var fields = {
      totalInstall: netData.rows[0].metricValues[0].value,
      activeUsers: netData.rows[0].metricValues[1].value,
      newUsers: newVsReturning.rows[0].metricValues[2].value,
      returningUsers: newVsReturning.rows[1].metricValues[0].value,
      screenTime: netData.rows[0].metricValues[3].value,
      countries,
      operatingSystem
    }
    data.push(fields);

    return res.status(200).json({
      success: true,
      message: "Analytics Data!",
      data
    })
  } catch (err) {
    return res.status(402).json({
      success: false,
      message: err.message,
      Description: err
    })
  }
};

// ================== Firebase Push Notification Configuration =======================================
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.serviceAccount_PROJECT_ID,
    clientEmail: process.env.serviceAccount_CLIENT_EMAIL,
    privateKey: process.env.serviceAccount_PRIVATE_KEY
  })
});
// ================== Firebase Push Notification Configuration =======================================

exports.pushNotification = async (req, res) => {

  let registrationTokens = []
  if (!req.body.title || req.body.title == '') {
    return res.status(400).json({ errors: "Please include title in body" });
  };

  if (!req.body.message || req.body.message == '') {
    return res.status(400).json({ errors: "Please include message in body" });
  };

  const tokens = await client.query(`SELECT token FROM tokens `)
  console.log(tokens.rows)
  await Promise.all(tokens.rows.map(async (el) => {
    registrationTokens.push(el.token)
  }))
  // Set the message payload
  const payload = {
    notification: {
      title: req.body.title,
      body: req.body.message
    }
  };

  // Set the message options
  const options = {
    priority: 'high',
    timeToLive: 60 * 60 * 24 // 24 hours
  };

  // Send the message to the user's device using their device token
  admin.messaging().sendToDevice(registrationTokens, payload, options)
    .then((response) => {
      console.log('Push notification sent successfully:', response);
      const { results, ...otherData } = response
      res.status(200).json({
        result: true,
        message: results,
        data: otherData
      })
    })
    .catch((error) => {
      console.error('Error sending push notification:', error);
      res.status(200).json({
        result: false,
        message: "Error sending push notification",
        date: error
      })
    });

}