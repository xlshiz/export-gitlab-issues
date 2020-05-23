const axiosRest = require("axios-rest-client")

async function _getIssues(url, token, projectID, state, saveFunc) {
  console.log('Fetching GitLab issues...');
  let jsonList = new Array();
  const api = axiosRest({
    baseUrl: url + "/api/v4",
    headers: { 'PRIVATE-TOKEN': token }
  })
  let res = await api.projects[projectID].issues.all({
    state,
    per_page: 100,
    page: 1
  });
  let maxPage = res.headers['x-total-pages'];
  console.log(`Issues fetched... Total pages: ${maxPage}`);
  jsonList = jsonList.concat(res.data);
  console.log(`Issues fetched... Current pages: 1 ${res.data.length} ${jsonList.length}`);
  for (let i = 2; i <= maxPage; i++) {
    res = await api.projects[projectID].issues.all({
      state,
      per_page: 100,
      page: i
    });
    console.log(`Issues fetched... Current pages: ${i} ${res.data.length} ${jsonList.length}`);
    jsonList = jsonList.concat(res.data);
  }
  console.log(`Issues fetched... Total issues fetched: ${jsonList.length}`);
  saveFunc(jsonList);
}
exports.getIssues = _getIssues;
