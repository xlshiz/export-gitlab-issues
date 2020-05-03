const Parser = require("rss-parser"); // "rss-parser": "^3.7.1"
const ExportToCsv = require("export-to-csv").ExportToCsv; // "export-to-csv": "^0.2.1"
const fs = require("fs");

// 1. Go to the issue list
//   e.g. https://gitlab.com/gitlab-com/www-gitlab-com/issues?scope=all&utf8=%E2%9C%93&state=all
// 2. Get the link from "Subscribe to RSS feed" in the issue list
//   A `feed_token` will be present in the link, I removed mine
// 3. Add `page` parameter, paste URL below (I remove my token for security):
const ISSUES_FEED_URL = `https://gitlab.com/gitlab-com/www-gitlab-com/issues.atom?feed_token=< REMOVED!! >&scope=all&state=all&utf8=%E2%9C%93`;
const MAX_PAGE = 150; // Increase to get more issues
const CSV_FILENAME = "data/issues-list.csv";

console.log("Fetching GitLab issues...");

let fetchPromises = [];
for (var i = 1; i <= MAX_PAGE; i++) {
  let parser = new Parser({
    customFields: {
      // Add more fields as needed e.g. "summary", "description", ...
      item: ["labels", "milestone", "updated"]
    }
  });

  fetchPromises.push(parser.parseURL(ISSUES_FEED_URL + "&page=${i}"));
}

Promise.all(fetchPromises)
  .then(feeds => {
    console.log("Issues fetched...");

    // Get items & flatten arrays
    let items = feeds.map(feed => feed.items);
    items = items.reduce((acc, val) => acc.concat(val), []);

    items.forEach(item => {
      // Join labels in the same column
      if (item.labels) {
        let labels = item.labels.label;
        item.labels = labels.join("|");
      } else {
        item.labels = "";
      }

      // Get project name
      const projectNameMatcher = new RegExp("([a-zA-Z-]+/[a-zA-Z-]+)/issues"); // Matches "group-name/project-name"
      item.project = projectNameMatcher.exec(item.link)[1];
    });

    console.log(`Issues fetched... Total issues fetched: ${items.length}`);
    if (MAX_PAGE * 20 == items.length) {
      console.log(
        "  -> There might be more issues, increase the number of pages next time?"
      );
    }
    saveItemsToCsv(items);
  })
  .catch(err => {
    console.log("ERROR Fetching!");
    console.log(err);
  })
  .finally(() => {
    console.log("Done!");
  });

function saveItemsToCsv(data) {
  console.log(`Saving to file ${CSV_FILENAME}...`);

  const csvExporter = new ExportToCsv({ useKeysAsHeaders: true });
  const csv = csvExporter.generateCsv(data, true);
  fs.writeFileSync(CSV_FILENAME, csv);
  console.log(`Saving to file... saved.`);
}
