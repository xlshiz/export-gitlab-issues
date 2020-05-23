const Gitlab = require('./gitlab');
const fs = require('fs');

function saveItemsToCsv(file) {
  return function(data) {
    console.log(`Saving to file ${file}...`);

    let itemList = [];
    data.forEach((element) => {
      const projectNameMatcher = new RegExp(
        '([a-zA-Z-]+/[0-9a-zA-Z-]+)/-/issues'
      );
      let newItem = {
        id: element.iid,
        project: projectNameMatcher.exec(element.web_url)[1],
        title: element.title,
        content: element.description,
        author: element.author.name,
        pubdate: element.created_at,
      };
      if (element.milestone) {
        newItem.milstone = element.milestone.title;
      } else {
        newItem.milstone = '';
      }
      // project title content author milstone pubdate link
      itemList.push(newItem);
    });

    const csvExporter = new ExportToCsv({ useKeysAsHeaders: true });
    const csv = csvExporter.generateCsv(itemList, true);
    fs.writeFileSync(file, csv);
    console.log(`Saving to file... saved.`);
  };
}

Gitlab.getIssues("http://gitlab.cn", '123456', 1, "opened", saveItemsToCsv("./a.csv"));
