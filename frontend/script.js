function checkVisited() {
    const visitedCookie = document.cookie.split('; ').find(row => row.startsWith('visited='));
    if (visitedCookie) {
        // Put some code here, if user visited our page
        // Change target to any id, where you want text/smth to appear
        document.getElementById('target').innerHTML = '<h1>Already visited</h1><button style="font-size: 1.5em;" class="button-class" onclick="deleteCookie()" value="">Delete cookie</button>';// <button style="font-size: 1.5em;" class="button-class" onclick="deleteCookie()" value="">Delete cookie</button>
    } else {
        //If not, display some introductory info or provide a button that checks user as visited, since cookies expire or can be deleted by accident
        document.getElementById('target').innerHTML = '<h1>First time here, huh?</h1><button style="font-size: 1.5em;" class="button-class" onclick="changeCookie()" value="">Not my first time here</button>';

    }
}

function changeCookie() {
    expiry = new Date();
    expiry.setMonth(expiry.getMonth()+1); //time of expiration
    document.cookie = "visited=true; expires="+expiry.toGMTString(); // expire can be changed whenever needed
    document.getElementById('target').innerHTML = '<h1>Already visited</h1>';
}

function deleteCookie() {
    document.cookie = "visited=; expires= Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
}


window.onload = checkVisited;