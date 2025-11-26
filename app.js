/**
 * App Controller
 * Handles UI interactions and Chart updates
 */

// State
const state = {
    principal: 95018,
    interestRate: 2.55,
    monthlyPayment: 407.43,
    amortizationAmount: 0,
    strategy: 'term' // 'term' or 'quota'
};

// Chart Instances
const charts = {
    capital: null,
    interest: null,
    time: null,
    roi: null
};

// DOM Elements
const elements = {
    principal: document.getElementById('principal'),
    interestRate: document.getElementById('interestRate'),
    monthlyPayment: document.getElementById('monthlyPayment'),
    amortizationSlider: document.getElementById('amortizationSlider'),
    amortizationInput: document.getElementById('amortizationInput'),
    strategyTerm: document.getElementById('strategyTerm'),
    strategyQuota: document.getElementById('strategyQuota'),
    calculateBtn: document.getElementById('calculateBtn'),
    bestStrategyBtn: document.getElementById('bestStrategyBtn'),
    themeToggle: document.getElementById('themeToggle'),

    // Display
    displayPrincipal: document.getElementById('displayPrincipal'),
    displayYears: document.getElementById('displayYears'),
    yearsSavedLabel: document.getElementById('yearsSavedLabel'),
    displayTotalInterest: document.getElementById('displayTotalInterest'),
    interestSavedLabel: document.getElementById('interestSavedLabel'),
    displayTotalSavings: document.getElementById('displayTotalSavings')
};

// Initialization
function init() {
    setupEventListeners();
    updateSimulation();
    setupTheme();
}

function setupEventListeners() {
    // Inputs
    elements.principal.addEventListener('input', (e) => {
        state.principal = parseFloat(e.target.value) || 0;
        updateSimulation();
    });

    elements.interestRate.addEventListener('input', (e) => {
        state.interestRate = parseFloat(e.target.value) || 0;
        updateSimulation();
    });

    elements.monthlyPayment.addEventListener('input', (e) => {
        state.monthlyPayment = parseFloat(e.target.value) || 0;
        updateSimulation();
    });

    // Slider & Input Sync
    elements.amortizationSlider.addEventListener('input', (e) => {
        state.amortizationAmount = parseFloat(e.target.value) || 0;
        elements.amortizationInput.value = state.amortizationAmount;
        updateSimulation();
    });

    elements.amortizationInput.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value) || 0;
        if (val > 10000) val = 10000; // Cap for slider visual
        state.amortizationAmount = val;
        elements.amortizationSlider.value = val;
        updateSimulation();
    });

    // Strategy
    const handleStrategyChange = (e) => {
        if (e.target.checked) {
            state.strategy = e.target.value;
            updateSimulation();
        }
    };
    elements.strategyTerm.addEventListener('change', handleStrategyChange);
    elements.strategyQuota.addEventListener('change', handleStrategyChange);

    // Buttons
    elements.calculateBtn.addEventListener('click', updateSimulation);
    elements.bestStrategyBtn.addEventListener('click', findBestStrategy);

    // Theme
    elements.themeToggle.addEventListener('click', toggleTheme);
}

function updateSimulation() {
    // 1. Prepare Params
    const baseParams = {
        principal: state.principal,
        annualRate: state.interestRate,
        monthlyPayment: state.monthlyPayment,
        amortizationAmount: 0,
        strategy: 'term'
    };

    const simParams = {
        ...baseParams,
        amortizationAmount: state.amortizationAmount,
        strategy: state.strategy
    };

    // 2. Run Simulation
    const results = Mortgage.compare(baseParams, simParams);

    // 3. Update UI Metrics
    updateMetrics(results);

    // 4. Update Charts
    updateCharts(results);
}

function updateMetrics(results) {
    const { base, sim, savings } = results;

    // Format currency
    const fmt = (num) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
    const fmtDec = (num) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(num);

    elements.displayPrincipal.textContent = fmt(state.principal);

    // Years
    elements.displayYears.textContent = `${fmtDec(sim.totalYears)} años`;
    if (savings.years > 0.1) {
        elements.yearsSavedLabel.textContent = `-${fmtDec(savings.years)} años`;
        elements.yearsSavedLabel.style.color = 'var(--accent-color)';
    } else {
        elements.yearsSavedLabel.textContent = 'Mismo plazo';
        elements.yearsSavedLabel.style.color = 'var(--text-color)';
    }

    // Interest
    elements.displayTotalInterest.textContent = fmt(sim.totalInterest);
    if (savings.interest > 100) {
        elements.interestSavedLabel.textContent = `-${fmt(savings.interest)} ahorro`;
        elements.interestSavedLabel.style.color = 'var(--primary-color)';
    } else {
        elements.interestSavedLabel.textContent = 'Sin ahorro';
        elements.interestSavedLabel.style.color = 'var(--text-color)';
    }

    // Total Savings Display
    elements.displayTotalSavings.textContent = fmt(savings.interest);
}

function updateCharts(results) {
    const { base, sim } = results;

    // Base configuration for all charts
    const textColor = getComputedStyle(document.body).getPropertyValue('--text-color');
    const baseConfig = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: textColor }
            }
        }
    };

    // 1. Capital Evolution Chart (Line)
    const labels = base.schedule.filter((_, i) => i % 12 === 0).map(d => `Año ${Math.floor(d.month / 12)}`);
    const baseData = base.schedule.filter((_, i) => i % 12 === 0).map(d => d.balance);

    const simData = [];
    for (let i = 0; i < base.schedule.length; i += 12) {
        if (i < sim.schedule.length) {
            simData.push(sim.schedule[i].balance);
        } else {
            simData.push(0);
        }
    }

    updateChart('capital', 'line', {
        labels: labels,
        datasets: [
            {
                label: 'Sin Amortizar',
                data: baseData,
                borderColor: '#a3b1c6',
                borderWidth: 2,
                fill: false,
                tension: 0.4
            },
            {
                label: 'Con Amortización',
                data: simData,
                borderColor: '#6d5dfc',
                borderWidth: 3,
                backgroundColor: 'rgba(109, 93, 252, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    }, {
        ...baseConfig,
        scales: {
            x: { ticks: { color: textColor } },
            y: {
                ticks: { color: textColor },
                beginAtZero: true
            }
        }
    });

    // 2. Interest Chart (Vertical Bar)
    updateChart('interest', 'bar', {
        labels: ['Intereses Totales'],
        datasets: [
            {
                label: 'Sin Amortizar',
                data: [base.totalInterest],
                backgroundColor: '#a3b1c6',
                borderWidth: 0
            },
            {
                label: 'Con Amortización',
                data: [sim.totalInterest],
                backgroundColor: '#6d5dfc',
                borderWidth: 0
            }
        ]
    }, {
        ...baseConfig,
        scales: {
            x: {
                ticks: { color: textColor }
            },
            y: {
                ticks: { color: textColor },
                beginAtZero: true
            }
        }
    });

    // 3. Time Chart (Horizontal Bar)
    updateChart('time', 'bar', {
        labels: ['Tiempo (Años)'],
        datasets: [
            {
                label: 'Sin Amortizar',
                data: [base.totalYears],
                backgroundColor: '#a3b1c6',
                borderRadius: 5,
                borderWidth: 0
            },
            {
                label: 'Con Amortización',
                data: [sim.totalYears],
                backgroundColor: '#00d2ff',
                borderRadius: 5,
                borderWidth: 0
            }
        ]
    }, {
        ...baseConfig,
        indexAxis: 'y',
        scales: {
            x: {
                ticks: { color: textColor },
                beginAtZero: true
            },
            y: {
                ticks: { color: textColor }
            }
        }
    });

    // 4. ROI / Impact Chart (Doughnut)
    const rentalIncome = 850 * 12 * sim.totalYears;
    const totalSavings = base.totalInterest - sim.totalInterest;

    updateChart('roi', 'doughnut', {
        labels: ['Ahorro Intereses', 'Ingresos Alquiler (Proyectado)'],
        datasets: [{
            data: [Math.max(0, totalSavings), rentalIncome],
            backgroundColor: ['#6d5dfc', '#00d2ff'],
            borderWidth: 0
        }]
    }, baseConfig);
}

function updateChart(key, type, data, options) {
    const canvasId = `${key}Chart`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (charts[key]) {
        charts[key].destroy();
    }

    charts[key] = new Chart(ctx, {
        type: type,
        data: data,
        options: options
    });
}

function findBestStrategy() {
    const baseParams = {
        principal: state.principal,
        annualRate: state.interestRate,
        monthlyPayment: state.monthlyPayment,
        amortizationAmount: state.amortizationAmount || 1000,
        strategy: 'term'
    };

    if (state.amortizationAmount === 0) {
        state.amortizationAmount = 1000;
        elements.amortizationSlider.value = 1000;
        elements.amortizationInput.value = 1000;
        baseParams.amortizationAmount = 1000;
    }

    const simTerm = Mortgage.simulate({ ...baseParams, strategy: 'term' });
    const simQuota = Mortgage.simulate({ ...baseParams, strategy: 'quota' });

    const trueBase = Mortgage.simulate({ ...baseParams, amortizationAmount: 0 });

    const saveTerm = trueBase.totalInterest - simTerm.totalInterest;
    const saveQuota = trueBase.totalInterest - simQuota.totalInterest;

    let msg = '';
    if (saveTerm > saveQuota) {
        msg = `🏆 <b>Reducir PLAZO</b> es mejor.\n\nAhorras ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(saveTerm - saveQuota)} más que reduciendo cuota.`;
        state.strategy = 'term';
        elements.strategyTerm.checked = true;
    } else {
        msg = `🏆 <b>Reducir CUOTA</b> es mejor (raro, pero posible).\n\nAhorras ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(saveQuota - saveTerm)} más.`;
        state.strategy = 'quota';
        elements.strategyQuota.checked = true;
    }

    alert(msg.replace(/<b>/g, '').replace(/<\/b>/g, ''));
    updateSimulation();
}

function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateSimulation();
}

// Start
init();
