let sidebar = document.querySelector(".sidebar");
let pageWrapper = document.querySelector(".page-wrapper");
let mapSwitcher = document.querySelector(".toggle-container");
let buttonObi = document.querySelector(".label-top");
let buttonMug = document.querySelector(".label-bottom");

sidebar.addEventListener("mouseover", () => {
    sidebar.classList.add("open");
    menuBtnChange();
    mapSwitcher.style.display = 'block';
});

sidebar.addEventListener("mouseout", () => {
    sidebar.classList.remove("open");
    menuBtnChange();
    mapSwitcher.style.display = 'none';
});

buttonObi.addEventListener("click", () => {
    window.location.href = 'map.html'; 
});

buttonMug.addEventListener("click", () => {
    window.location.href = 'mapMUG.html'; 
});

// following are the code to change sidebar button(optional)
function menuBtnChange() {
    if (sidebar.classList.contains("open")) {
        pageWrapper.classList.add("active");
    } else {
        pageWrapper.classList.remove("active");
    }
}

const apiUrlDoc = 'https://websitebackend.12ly2k35msg2.eu-de.codeengine.appdomain.cloud/seforall';
$('#apiInfo').on('click', function () {
    window.open(`https://${apiUrlDoc.split('/')[2]}/api-docs/`, '_blank');
});