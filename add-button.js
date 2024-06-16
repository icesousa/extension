let elements = document.querySelectorAll(".atividades");

elements.forEach(element => {
    let titleElement = element.querySelector("h4 > small");
    if (titleElement) {
        var button = document.createElement("button");
        button.innerText = "Clique para criar um evento";
        button.id = 'inserted';
        button.setAttribute('data-name', 'name1');
        const eventData = extractData(element);
        button.onclick = function () {

            showPopup(eventData);
        };

        button.fun = function () {
            alert('fun!');
        };

        // Adiciona o botão ao lado do título
        titleElement.appendChild(button);
        console.log(titleElement.innerText + " button created");


    } else {
        console.error('Elemento "h4 > small" não encontrado dentro de .atividades.');
        alert('Elemento "h4 > small" não encontrado dentro de .atividades.');
    }
});

alert('Buttons inserted next to titles.');

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
    let completion = completionElement ? completionElement.textContent.trim() : '0%';

    return { title, period, code, score, completion };
}

function showPopup(eventData) {
    const popupContent = `
        <div>
            <h2>Confirme os detalhes do evento</h2>
            <p><strong>Título:</strong> ${eventData.title}</p>
            <p><strong>Período:</strong> ${eventData.period}</p>
            <p><strong>Código:</strong> ${eventData.code}</p>
            <p><strong>Pontuação:</strong> ${eventData.score}</p>
            <p><strong>Conclusão:</strong> ${eventData.completion}</p>
            <button id="confirmEventButton">Confirmar</button>
            <button id="cancelButton">Cancelar</button>
        </div>
    `;

    const popup = document.createElement('div');
    popup.id = 'eventPopup';
    popup.style.position = 'fixed';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'white';
    popup.style.padding = '20px';
    popup.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.1)';
    popup.innerHTML = popupContent;

    document.body.appendChild(popup);

    document.getElementById('confirmEventButton').onclick = function () {
        document.body.removeChild(popup);
        confirmEventCreation(eventData);
    };

    document.getElementById('cancelButton').onclick = function () {
        document.body.removeChild(popup);
    };
}

function confirmEventCreation(eventData) {
    chrome.storage.local.get(['accessToken'], (result) => {
        if (result.accessToken) {
            createGoogleCalendarEvent(result.accessToken, eventData);
        } else {
            alert('Você precisa fazer login com o Google primeiro.');
        }
    });
}

function createGoogleCalendarEvent(token, event) {
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
}

function parseDate(dateStr) {
    let [day, month, year] = dateStr.split('/');
    return new Date(Number(year) + 2000, Number(month) - 1, Number(day));
}