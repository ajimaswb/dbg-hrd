import https from 'https';

function fetchPage(token) {
  let url = 'https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY&pageSize=100';
  if (token) url += '&pageToken=' + token;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      let j = JSON.parse(data);
      if(j.models) {
        j.models.forEach(m => console.log(m.name));
      }
      if(j.nextPageToken) {
        fetchPage(j.nextPageToken);
      }
    });
  });
}
fetchPage();
