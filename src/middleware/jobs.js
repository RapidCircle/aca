/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/


const db = require('../db.js');
const path = require('path');
const tokens = require('../tokens.js');
const cron = require('node-cron');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('jobs:engine');

const jobs = [];

function daysBetween(date1, date2) {
    //Get 1 day in milliseconds
    var one_second = 1000;

    // Convert both dates to milliseconds
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();

    // Calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;

    // Convert back to seconds and return
    return Math.round(difference_ms / one_second);
}


module.exports = {

    getWorkers() {
        return jobs;
    },

    async start(oauth2) {
        let activeJobs = db.get('jobs').filter({
            enabled: true
        }).value();

        for (let w = 0; w < activeJobs.length; w++) {            
            let options = {};
            
            if (activeJobs[w].options.runAsUserId) {
                let runAsUser = db.get(`users.${activeJobs[w].options.runAsUserId}`).value();
                runAsUser.oauthToken = oauth2.accessToken.create(runAsUser.oauthToken.token);
                options.accessToken = await tokens.getAccessToken({ user: runAsUser });
            }

            try {
                if (cron.validate(activeJobs[w].schedule)) {
                    debug.info(`Registered job ${activeJobs[w].id} - ${activeJobs[w].description}`);
                    let job = cron.schedule(activeJobs[w].schedule, async () => {
                        let startAt = new Date();
                        debug.verbose(`Running job id ${activeJobs[w].id} at ${startAt}`);
                        job.stop();
                        if (activeJobs[w].lastStartAt) options.lastStartAt = new Date(activeJobs[w].lastStartAt);
                        if (activeJobs[w].lastEndAt) options.lastEndAt = new Date(activeJobs[w].lastEndAt);
                        if (activeJobs[w].secondsTillCompletion) options.secondsTillCompletion = new Date(activeJobs[w].secondsTillCompletion);
                        await require(path.join(__dirname, activeJobs[w].code))(options);
                        let endAt = new Date();
                        debug.verbose(`Finished job id ${activeJobs[w].id} at ${endAt}`);
                        job.start();

                        db.get('jobs').find({id: activeJobs[w].id}).set('lastStartAt', startAt).write();
                        db.get('jobs').find({id: activeJobs[w].id}).set('lastEndAt', endAt).write();
                        db.get('jobs').find({id: activeJobs[w].id}).set('secondsTillCompletion', daysBetween(startAt, endAt)).write();
                    });
                    jobs.push(job);
                    job.start();
                }
                else {
                    debug.error(`Could not start job ${activeJobs[w].id}. Because invalid cron schedule.`);
                }
            }
            catch (err) {
                debug.error(err);
            }
        }
    },

    stop() {
        for (let w = 0; w < jobs.length; w++) {
            jobs[w].destroy();
        }
        jobs = [];
    }
}