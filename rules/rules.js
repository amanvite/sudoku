function toggleMainMenu(event) {
    if (event) event.stopPropagation();
    const menuBtn = document.getElementById('menu-icon-btn');
    const mainMenu = document.getElementById('main-menu');
    if (menuBtn && mainMenu) {
        menuBtn.classList.toggle('open');
        mainMenu.classList.toggle('show');
    }
}

document.addEventListener('click', (e) => {
    const mainMenuBtn = document.getElementById('menu-icon-btn');
    const mainMenu = document.getElementById('main-menu');
    
    if (mainMenu && mainMenu.classList.contains('show') && mainMenuBtn && !mainMenuBtn.contains(e.target) && !mainMenu.contains(e.target)) {
        mainMenu.classList.remove('show');
        mainMenuBtn.classList.remove('open');
    }
});