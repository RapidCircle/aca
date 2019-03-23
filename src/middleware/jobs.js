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

        const runJob = async function(job, options) {
            let startAt = new Date();
            debug.verbose(`Running job id ${job.id} at ${startAt}`);
            if (job.lastStartAt) options.lastStartAt = new Date(job.lastStartAt);
            if (job.lastEndAt) options.lastEndAt = new Date(job.lastEndAt);
            if (job.secondsTillCompletion) options.secondsTillCompletion = new Date(job.secondsTillCompletion);
            await require(path.join(__dirname, job.code))(options);
            let endAt = new Date();
            debug.verbose(`Finished job id ${job.id} at ${endAt}`);

            db.get('jobs').find({id: job.id}).set('lastStartAt', startAt).write();
            db.get('jobs').find({id: job.id}).set('lastEndAt', endAt).write();
            db.get('jobs').find({id: job.id}).set('secondsTillCompletion', daysBetween(startAt, endAt)).write();
        }

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

                    if (activeJobs[w].runOnceOnStart) {
                        setTimeout(async () => {
                            await runJob(activeJobs[w], options);
                        }, 1000);
                    }

                    let job = cron.schedule(activeJobs[w].schedule, async () => {
                        job.stop();
                        await runJob(activeJobs[w], options);                        
                        job.start();
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