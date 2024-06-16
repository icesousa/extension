const CLIENT_ID = '550055682847-gmdj67r7qo58patf9hhpbi5cd2k578gs.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const REDIRECT_URI = `https://anoinpfmaniepcpgjabpkmanlepnnhjn.chromiumapp.org`;

window.loginWithGoogle = loginWithGoogle;
document.getElementById('extractButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab.url.includes('https://www.colaboraread.com.br/aluno/timeline/')) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractAndDownloadData
      });
    } else {
      alert('This extension only works on the specified timeline page.');
    }
  });
});

document.getElementById('googleLoginButton').addEventListener('click', () => {
  loginWithGoogle();
});

document.getElementById('googleCalendarButton').addEventListener('click', () => {
  chrome.storage.local.get(['accessToken'], (result) => {
    if (result.accessToken) {
      createGoogleCalendarEvents(result.accessToken);
    } else {
      alert('You need to login with Google first.');
    }
  });
});

function loginWithGoogle() {
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`;

  chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (redirectUrl) => {
    if (chrome.runtime.lastError || !redirectUrl) {
      alert('Failed to authenticate.');
      return;
    }
    const urlParams = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
    const accessToken = urlParams.get('access_token');
    if (accessToken) {
      chrome.storage.local.set({ accessToken: accessToken }, () => {
        alert('Login successful.');
      });
    } else {
      alert('Failed to retrieve access token.');
    }
  });
}

function createGoogleCalendarEvents(token) {
  console.log('Creating Google Calendar events with token:', token);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: extractTasksData,
    }, (results) => {
      console.log('Extracted tasks data:', results);
      if (results && results[0] && results[0].result) {
        const events = results[0].result.filter(event => event.completion !== '100%'); // Filter out events with 100% completion
        events.forEach(event => {
          const [startStr, endStr] = event.period.split(' - ');
          const startDate = parseDate(startStr).toISOString();
          const endDate = parseDate(endStr).toISOString();

          fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              summary: event.title,
              description: `Code: ${event.code}\nScore: ${event.score}\nCompletion: ${event.completion}`,
              start: {
                dateTime: startDate,
                timeZone: 'America/Sao_Paulo'
              },
              end: {
                dateTime: endDate,
                timeZone: 'America/Sao_Paulo'
              }
            })
          }).then(response => response.json()).then(data => {
            console.log('Event created:', data);
            alert(`Event created: ${data.summary}`);
          }).catch(error => {
            console.error('Error creating event:', error);
            alert(`Error creating event: ${error.message}`);
          });
        });
      } else {
        console.error('No task data extracted.');
        alert('No task data extracted.');
      }
    });
  });
}

function parseDate(dateStr) {
  let [day, month, year] = dateStr.split('/');
  return new Date(Number(year) + 2000, Number(month) - 1, Number(day));
}

function extractAndDownloadData() {
  function extractData(element) {
    let titleElement = element.querySelector("h4 > small");
    let periodElement = element.querySelector("p:nth-child(2) > small > em");
    let codeElement = element.querySelector("p:nth-child(4) > small > em");
    let scoreElement = element.querySelector(".progress-bar > small");
    let completionElement = element.querySelector(".progress-bar-success > small");

    let title = titleElement ? titleElement.textContent.trim() : 'Title not found';
    let period = periodElement ? periodElement.textContent.trim() : 'Period not found';
    let code = codeElement ? codeElement.textContent.trim() : 'Code not found';
    let score = scoreElement ? scoreElement.textContent.trim() : 'Score not found';
    let completion = completionElement ? completionElement.textContent.trim() : 'Completion not found';

    return { title, period, code, score, completion };
  }

  function parseDate(dateStr) {
    let [day, month, year] = dateStr.split('/');
    return new Date(Number(year) + 2000, Number(month) - 1, Number(day));
  }

  function isPeriodOngoingOrUpcoming(period) {
    if (period === 'Period not found') return false;

    let [startStr, endStr] = period.split(' - ');
    let start = parseDate(startStr);
    let end = parseDate(endStr);
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    return today <= end;
  }

  let elements = document.querySelectorAll(".atividades");

  let data = [];
  elements.forEach(element => {
    let activityData = extractData(element);


    if (isPeriodOngoingOrUpcoming(activityData.period) && activityData.completion !== '100%') {
      data.push(`Title: ${activityData.title}`);
      data.push(`Period: ${activityData.period}`);
      data.push(`Code: ${activityData.code}`);
      data.push(`Score: ${activityData.score}`);
      data.push(`Completion: ${activityData.completion}`);
      data.push("--------------------------");
    }
  });

  let blob = new Blob([data.join('\n')], { type: 'text/plain' });
  let url = URL.createObjectURL(blob);

  let a = document.createElement('a');
  a.href = url;
  a.download = 'activities.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function extractTasksData() {
  function extractData(element) {
    let titleElement = element.querySelector("h4 > small");
    let periodElement = element.querySelector("p:nth-child(2) > small > em");
    let codeElement = element.querySelector("p:nth-child(4) > small > em");
    let scoreElement = element.querySelector(".progress-bar > small");
    let completionElement = element.querySelector(".progress-bar-success > small");

    let title = titleElement ? titleElement.textContent.trim() : 'Title not found';
    let period = periodElement ? periodElement.textContent.trim() : 'Period not found';
    let code = codeElement ? codeElement.textContent.trim() : 'Code not found';
    let score = scoreElement ? scoreElement.textContent.trim() : 'Score not found';
    let completion = completionElement ? completionElement.textContent.trim() : 'Completion not found';

    return { title, period, code, score, completion };
  }

  function parseDate(dateStr) {
    let [day, month, year] = dateStr.split('/');
    return new Date(Number(year) + 2000, Number(month) - 1, Number(day));
  }

  function isPeriodOngoingOrUpcoming(period) {
    if (period === 'Period not found') return false;

    let [startStr, endStr] = period.split(' - ');
    let start = parseDate(startStr);
    let end = parseDate(endStr);
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    return today <= end;
  }

  let elements = document.querySelectorAll(".atividades");

  let tasks = [];
  elements.forEach(element => {
    const activityData = extractData(element);

    const isValidActivity =
      isPeriodOngoingOrUpcoming(activityData.period) &&
      activityData.completion !== '100%' &&
      activityData.title &&
      !activityData.title.includes('Eng Ava1') &&
      !activityData.title.includes('Leitura1');

    if (isValidActivity) {
      tasks.push(activityData);
    }
  });


  return tasks;
}
