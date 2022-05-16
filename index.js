/**
 * @author Paul Jeremiah Mugaya
 * @email paulmugaya@live.com
 * @create date 2022-05-16 07:13:13
 * @modify date 2022-05-16 07:13:14
 * @desc [description]
 */

const { Command } = require("commander");
const walk = require("walk");
const fs = require("fs");
const path = require("path");
const package = require("./package.json");
const program = new Command();

program
  .description(package.description)
  .version(package.version)
  .option("-d, --directory <string>", "Folder containing corpus", "./")
  .option("-l, --logs <value>", "Print logs", true)
  .option(
    "-lo, --left-output <string>",
    "Left output file",
    "./test/corpus.en.txt"
  )
  .option(
    "-ro, --right-output <string>",
    "Right output file",
    "./test/corpus.und.txt"
  )
  .option("-ls, --left-suffix <string>", "Left suffix", ".en.txt")
  .option("-rs, --right-suffix <string>", "Left suffix", ".und.txt")
  .option("--ignore, --ignore [ignore...]", "list of directories to ignore", [])
  .action(generate);

program.parse();

function generate({
  directory,
  leftOutput,
  rightOutput,
  leftSuffix,
  rightSuffix,
  ignore,
  logs,
}) {
  let walker = walk.walk(directory, {
    followLinks: false,
    filters: ignore,
  });

  let left = fs.openSync(leftOutput, "w");
  let right = fs.openSync(rightOutput, "w");

  walker.on("file", function (root, fileStats, next) {
    if (fileStats.name.endsWith(leftSuffix)) {
      let rightPath = path.resolve(
        root,
        fileStats.name.replace(new RegExp(leftSuffix), rightSuffix)
      );

      if (fs.existsSync(rightPath)) {
        let leftPath = path.resolve(root, fileStats.name);
        let bufferLeft = fs.readFileSync(leftPath);
        let bufferRight = fs.readFileSync(rightPath);
        let leftLines = bufferLeft.toString().split("\n");
        let rightLines = bufferRight.toString().split("\n");

        if (
          rightLines.length > leftLines.length ||
          leftLines.length > rightLines.length
        ) {
          console.error(
            `Error: ${leftPath} and ${rightPath} have unmatched lines`
          );
          process.exit(0);
        }

        fs.writeSync(left, bufferLeft);
        fs.writeSync(right, bufferRight);

        if (JSON.parse(logs)) {
          console.log([
            leftPath,
            leftLines[leftLines.length - 1],
            rightLines.length,
            rightPath,
            rightLines[rightLines.length - 1],
            leftLines.length,
          ]);
        }
      }
    }

    next();
  });

  walker.on("errors", function (root, nodeStatsArray, next) {
    next();
  });

  walker.on("end", function () {
    console.log("done");
  });
}
