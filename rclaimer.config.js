module.exports = {
    apps: [{
        name: "AcaService",
        script: "./run.js",
        watch: true,
        ignore_watch: ["node_modules", "/usr/src/app/data"],
    }]
}
