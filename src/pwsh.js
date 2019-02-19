/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/

const path = require('path');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('powershell');
const _ = require('lodash');

module.exports = async function (script, argumentList, options = {}) {
    return new Promise((resolve, reject)=> {
        var output = '';
        var error = '';
        var ignoreExceptions = options.ignoreExceptions || false;
        var continueAtRaiseConditions = options.continueAtRaiseConditions || [];
        var spawn = require("child_process").spawn, child;
        script = path.resolve(__dirname, script);
        let command = process.platform === "linux" ? 'pwsh' : 'powershell.exe'
        let parameters = [script];

        for (let option in argumentList) {
            parameters.push(`-${option}`);
            parameters.push(`${argumentList[option]}`)
        }

        child = spawn(command, parameters);
        debug.info(`Running command ${command} ${script}`);
        debug.verbose(parameters.join(' '));
        child.stdout.on("data", function (data) {
            output += data;
        });
        child.stderr.on("data", function (data) {
            error += data;            
        });
        child.on("exit", function () {
            if ((error.length > 0 && !ignoreExceptions) ||
                (error.length > 0 && !_.find(continueAtRaiseConditions, (condition) => error.indexOf(condition) !== -1)) ) {                
                debug.error(`Script ended with error state.`);
                reject(error);
            }            
            else {
                debug.info(`finished`);                
                resolve(output);
            }            
        });
        child.stdin.end(); //end input
        
    });
}