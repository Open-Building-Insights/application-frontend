function checkNotification() {
    const apiUrl = 'https://websitebackend.12ly2k35msg2.eu-de.codeengine.appdomain.cloud/seforall'; 
    $.ajax({
        type: 'GET',
        url: `${apiUrl}/notifications`,
        contentType: 'application/json; charset=utf-8',
        // Increase the timeout to allow for longer processing time
        timeout: 900_000, // Set to 60 seconds (adjust as needed)
    }).done(function (result) {
        if (validateNotification(result)) 
            return writeNotificationMessage(result);
    }).fail(function (err) {
        console.error('Request Failed', 'The request took too long to process.', 'error: ' + err);
    });

    function writeNotificationMessage(result) {
        if (!!result) 
        {
            var html = `<div class="toast" onclick="toggleDetails()">
                            <div class="toast-header">
                            🔔 ${result.title}
                            <span id="arrow">
                                <i class='bx bx-chevron-down'></i>
                            </span>
                            </div>
                            <div id="toast-details" class="toast-details">
                                ${result.message} <br>
                                <button class="toast-button" link-url="${result.button_link + '.html'}" timestamp="${result.timestamp}" onclick="redirect(this)">${result.button_text}</button>
                            </div>
                        </div>`;
            $("body").append(html);
            $('.toast').css({ opacity: 1 });
        }
    }
}

function validateNotification(notification) {
    if (!notification) return;
    if (notification.timestamp > getDateClickLastNotification()) return true;
    else return;
}

function setDateClickLastNotification(timestamp) {
    localStorage.setItem("LAST_NOTIFICATION_DATE", timestamp);
}

function getDateClickLastNotification() {
    return localStorage.getItem("LAST_NOTIFICATION_DATE") != null ? parseInt(localStorage.getItem("LAST_NOTIFICATION_DATE")) : 0;
}

function redirect(el) {
    setDateClickLastNotification($(el).attr('timestamp'));
    window.location.href = $(el).attr('link-url');
}

function toggleDetails() {
    const details = document.getElementById('toast-details');
    const arrow = document.getElementById('arrow');

    const isVisible = details.style.display === 'block';
    details.style.display = isVisible ? 'none' : 'block';
    arrow.innerHTML = isVisible ? `<i class='bx bx-chevron-down'></i>` : `<i class='bx bx-chevron-up'></i>`;
}

window.onload = checkNotification();