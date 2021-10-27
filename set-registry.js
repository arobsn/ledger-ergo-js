var fs = require("fs");
var pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
var registry = null;

for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '-s') {
        registry = process.argv[++i];
        break;
    }
}

pkg.publishConfig = pkg.publishConfig || {};

if (!!registry) {
    pkg.publishConfig.registry = registry;
} else if (!!pkg.publishConfig.registry) {
    delete pkg.publishConfig.registry;
}

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 4));