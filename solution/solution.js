const table = document.getElementById("solution-grid");

function renderSolution() {
    const savedData = localStorage.getItem('sudokuGame');
    table.innerHTML = "";
    
    if (savedData) {
        const data = JSON.parse(savedData);
        const solution = data.solution;
        
        for (let i = 0; i < 9; i++) {
            const tr = document.createElement("tr");
            for (let j = 0; j < 9; j++) {
                const td = document.createElement("td");
                const input = document.createElement("input");
                input.type = "text";
                input.value = solution[i][j];
                input.readOnly = true;
                td.appendChild(input);
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
    } else {
        document.getElementById("message").innerText = "No active game found. Start a game first.";
    }
}

window.addEventListener('storage', (e) => {
    if (e.key === 'sudokuGame') {
        renderSolution();
    }
});

function init() {
    if (localStorage.getItem("sudokuTheme") === "dark") {
        document.body.classList.add("dark-mode");
    }
    renderSolution();
}

init();