/* Solar Savings Calculator — Mark Fitzpatrick */
(() => {
  "use strict";

  const CONTACT_EMAIL = "mark.fitzpatrick@classaenergy.com.au";
  const CONTACT_PHONE = "0434 151 237";
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwODBPWtpOHekwSVCMoEgReUiHTOFsh4kVsRq3fCJDvocAs34gqTOBrkjW3KuLubXA/exec";
  const BILL_UPLOAD_URL = location.hostname.endsWith("github.io") ? "https://solar-savings-calculator.mark-fitzpatri613891.chatgpt.site/api/upload-bill" : "/api/upload-bill";
  const TIMEZONE = "Australia/Melbourne";
  const IS_AGENT_PREVIEW = location.hostname === "terminal.local";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const money = (value) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(Math.round(value || 0));
  const number = (value) => new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(Math.round(value || 0));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  let currentStep = 1;
  let results = null;
  let charts = {};
  let calendarUrl = "";
  let latestPdfUrl = "";

  const propertyDefaults = {
    home: { label: "Home", rate: .35, supply: 1.2, day: 40, min: 3.3, max: 30, batteryMin: 10, batteryMax: 50, solarBase: 800, solarPerKw: 1050, batteryBase: 1800, batteryPerKwh: 1050 },
    business: { label: "Business", rate: .30, supply: 2.2, day: 70, min: 6.6, max: 100, batteryMin: 20, batteryMax: 150, solarBase: 3000, solarPerKw: 930, batteryBase: 4500, batteryPerKwh: 900 },
    commercial: { label: "Commercial", rate: .27, supply: 4.0, day: 78, min: 20, max: 500, batteryMin: 50, batteryMax: 750, solarBase: 7000, solarPerKw: 790, batteryBase: 9000, batteryPerKwh: 760 },
    farm: { label: "Farm", rate: .31, supply: 2.8, day: 67, min: 10, max: 250, batteryMin: 20, batteryMax: 300, solarBase: 4800, solarPerKw: 860, batteryBase: 6000, batteryPerKwh: 820 }
  };

  const STC_VALUE = 38.5;
  const SOLAR_DEEMING_YEARS = 5;
  const BATTERY_STC_FACTOR = 6.8;
  const stateSettings = {
    NSW: { name: "New South Wales", yield: 3.9, zone: 1.382 }, ACT: { name: "Australian Capital Territory", yield: 4.0, zone: 1.382 },
    VIC: { name: "Victoria", yield: 3.6, zone: 1.185 }, QLD: { name: "Queensland", yield: 4.2, zone: 1.536 },
    SA: { name: "South Australia", yield: 4.3, zone: 1.382 }, WA: { name: "Western Australia", yield: 4.4, zone: 1.382 },
    TAS: { name: "Tasmania", yield: 3.5, zone: 1.185 }, NT: { name: "Northern Territory", yield: 4.8, zone: 1.622 }
  };

  const sourceLinks = {
    federal: "https://cer.gov.au/schemes/renewable-energy-target/small-scale-renewable-energy-scheme/small-scale-technology-certificates/calculate-small-scale-technology-certificate-entitlements",
    battery: "https://cer.gov.au/news-and-media/news/2026/february/changes-to-rebate-solar-batteries-1-may",
    vic: "https://www.solar.vic.gov.au/solar-panel-rebate",
    nsw: "https://www.energy.nsw.gov.au/households/grants-rebates/household-energy-saving-upgrades/virtual-power-plant-vpp-incentive",
    wa: "https://www.wa.gov.au/organisation/energy-policy-wa/wa-residential-battery-scheme",
    act: "https://www.climatechoices.act.gov.au/policy-programs/sustainable-household-scheme",
    plenti: "https://www.plenti.com.au/heuf-discounted-green-loans",
    smartease: "https://www.smartease.com.au/"
  };

  const goalLabels = {
    bills: "lower ongoing energy costs",
    battery: "use more solar after sunset",
    independence: "reduce reliance on the grid"
  };

  function selected(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
  }

  function stateFromPostcode(postcode) {
    const pc = Number(postcode);
    if (pc >= 800 && pc <= 999) return "NT";
    if ((pc >= 2600 && pc <= 2618) || (pc >= 2900 && pc <= 2920)) return "ACT";
    if ((pc >= 2000 && pc <= 2599) || (pc >= 2619 && pc <= 2899) || (pc >= 2921 && pc <= 2999)) return "NSW";
    if ((pc >= 3000 && pc <= 3999) || (pc >= 8000 && pc <= 8999)) return "VIC";
    if ((pc >= 4000 && pc <= 4999) || (pc >= 9000 && pc <= 9999)) return "QLD";
    if (pc >= 5000 && pc <= 5999) return "SA";
    if (pc >= 6000 && pc <= 6999) return "WA";
    if (pc >= 7000 && pc <= 7999) return "TAS";
    return "NSW";
  }

  function applyPostcodeYield() {
    const postcode = $("#postcode").value.trim();
    if (!/^\d{4}$/.test(postcode)) return;
    const state = stateFromPostcode(postcode);
    $("#solarYield").value = stateSettings[state].yield.toFixed(1);
  }

  function solarStcEstimate(solarKw, state) {
    if (solarKw > 100) return { certificates: 0, value: 0, eligible: false };
    const certificates = Math.floor(solarKw * stateSettings[state].zone * SOLAR_DEEMING_YEARS);
    return { certificates, value: certificates * STC_VALUE, eligible: true };
  }

  function batteryStcEstimate(usableKwh) {
    if (usableKwh < 5) return { certificates: 0, value: 0 };
    const first = Math.min(usableKwh, 14);
    const middle = Math.min(Math.max(usableKwh - 14, 0), 14) * .6;
    const upper = Math.min(Math.max(usableKwh - 28, 0), 22) * .15;
    const certificates = Math.floor((first + middle + upper) * BATTERY_STC_FACTOR);
    return { certificates, value: certificates * STC_VALUE };
  }

  function stateProgram(state, property, batteryKwh) {
    if (state === "VIC" && property === "home") return { title: "Victoria Solar Homes", value: "Up to $1,400", note: "Solar PV rebate plus an optional matching interest-free loan. Household income must be under $150,000 and other eligibility rules apply.", link: sourceLinks.vic };
    if (state === "NSW" && property === "home") return { title: "NSW VPP incentive", value: "Possible extra value", note: "Eligible 2–50 kWh batteries connected to an approved virtual power plant may receive an additional incentive, calculated up to 28 kWh.", link: sourceLinks.nsw };
    if (state === "WA" && property === "home") return { title: "WA Residential Battery Scheme", value: batteryKwh ? "$1,300–$3,800 max" : "Up to $3,800", note: "Up to $130/kWh for Synergy customers or $380/kWh for Horizon Power customers, calculated on up to 10 kWh.", link: sourceLinks.wa };
    if (state === "ACT" && property === "home") return { title: "ACT Sustainable Household Scheme", value: "3% finance", note: "Eligible households may access $2,000–$20,000 over up to 10 years for approved energy upgrades; eligibility and approved providers apply.", link: sourceLinks.act };
    return { title: `${stateSettings[state].name} programs`, value: "Confirm at proposal", note: "No broad state rebate has been deducted. Targeted, council, VPP or time-limited programs may still apply and will be checked before quoting.", link: sourceLinks.federal };
  }

  function monthlyPayment(principal, annualRate, months, monthlyFee = 0) {
    if (principal <= 0) return 0;
    if (!annualRate) return principal / months + monthlyFee;
    const rate = annualRate / 12;
    return principal * rate / (1 - Math.pow(1 + rate, -months)) + monthlyFee;
  }

  function financeRecommendation(property, state, totalCapital, batteryIncluded) {
    if (property === "home") {
      if (state === "NSW") {
        const zeroInterest = Math.min(totalCapital, 15000);
        const remaining = Math.max(0, totalCapital - zeroInterest);
        const payment = zeroInterest / 120 + monthlyPayment(remaining, .0699, 180);
        return { brand: "Plenti · NSW Home Energy Saver", label: "Possible lowest eligible option", monthly: payment, term: `0% on up to $15,000 over 10 years${remaining ? "; balance modelled at 6.99%" : ""}`, note: "For eligible NSW owner-occupiers or landlords with household income up to $210,000. Credit and program criteria apply.", link: "https://www.plenti.com.au/home-energy-saver-loans/households" };
      }
      const rate = batteryIncluded ? .0699 : .0999;
      const months = batteryIncluded ? 180 : 120;
      return { brand: "Plenti", label: batteryIncluded ? "Possible HEUF discounted rate" : "Published Green Loan from rate", monthly: monthlyPayment(totalCapital, rate, months, batteryIncluded ? 0 : 8.99), term: `${(rate * 100).toFixed(2)}% p.a. model over ${months / 12} years`, note: batteryIncluded ? "Assumes the maximum 3% HEUF discount, including eligible VPP equipment, through an accredited installer. Approval and final terms apply." : "Uses Plenti's published from rate and monthly fee. The lowest rate is reserved for eligible applicants with exceptional credit.", link: batteryIncluded ? sourceLinks.plenti : "https://www.plenti.com.au/green-loans" };
    }
    return { brand: "Smart Ease", label: "Indicative $0-upfront pathway", monthly: monthlyPayment(totalCapital, .0999, 84), term: "7-year illustrative payment model", note: `Smart Ease publishes flexible commercial loan or rental plans but not a public live rate. This 9.99% comparison is not a Smart Ease quote.${totalCapital <= 150000 ? " Applications up to $150,000 may be assessed without financials." : " A custom assessment and financials may be required."}`, link: sourceLinks.smartease };
  }

  function showStep(step) {
    currentStep = step;
    $$(".wizard-step").forEach((el) => el.classList.toggle("active", Number(el.dataset.step) === step));
    $$("#stepIndicator li").forEach((el) => {
      const n = Number(el.dataset.step);
      el.classList.toggle("active", n === step);
      el.classList.toggle("complete", n < step);
      const bubble = el.querySelector("span");
      if (bubble) bubble.textContent = n < step ? "✓" : String(n);
    });
    $("#mobileStep").textContent = `Step ${step} of 5`;
    $("#progressBar").style.width = `${step * 20}%`;
    $("#calculator").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validateStep(step) {
    if (step === 1) {
      const valid = selected("property") && selected("goal");
      $("#step1Error").textContent = valid ? "" : "Please select a property type and your main goal.";
      return Boolean(valid);
    }
    if (step === 2) {
      const bill = Number($("#billAmount").value);
      const postcode = $("#postcode").value.trim();
      const valid = bill > 0 && /^\d{4}$/.test(postcode);
      $("#step2Error").textContent = valid ? "" : "Please enter a bill amount and a four-digit postcode.";
      return valid;
    }
    return true;
  }

  function updateDefaults(property) {
    const d = propertyDefaults[property];
    if (!d) return;
    $("#usageRate").value = d.rate;
    $("#supplyCharge").value = d.supply;
    $("#dayUse").value = String(d.day);
  }

  function annualBill() {
    const bill = Number($("#billAmount").value);
    const factor = { monthly: 12, quarterly: 4, annual: 1 }[$("#billFrequency").value] || 1;
    return bill * factor;
  }

  function nextSystemSize(raw, property) {
    const d = propertyDefaults[property];
    const standard = [3.3, 5, 6.6, 8, 10, 13.2, 15, 20, 25, 30, 40, 50, 60, 75, 100, 150, 200, 250, 300, 400, 500];
    const wanted = clamp(raw, d.min, d.max);
    return standard.find((size) => size >= wanted) || Math.ceil(wanted / 10) * 10;
  }

  function roundBattery(raw, property) {
    const d = propertyDefaults[property];
    const step = property === "home" ? 5 : 10;
    return clamp(Math.ceil(raw / step) * step, d.batteryMin, d.batteryMax);
  }

  function cumulativeCost(yearOne, years, rise, solarDegradation = 0, baseSavings = 0, upfront = 0) {
    let cost = upfront;
    for (let year = 0; year < years; year += 1) {
      if (baseSavings) {
        const adjustedSaving = baseSavings * Math.pow(1 + rise, year) * Math.pow(1 - solarDegradation, year);
        const grid = yearOne.grid * Math.pow(1 + rise, year);
        cost += Math.max(0, grid - adjustedSaving);
      } else {
        cost += yearOne * Math.pow(1 + rise, year);
      }
    }
    return cost;
  }

  function cumulativeBenefit(baseSaving, years, rise, degradation, upfront) {
    let total = -upfront;
    for (let y = 0; y < years; y += 1) total += baseSaving * Math.pow(1 + rise, y) * Math.pow(1 - degradation, y);
    return total;
  }

  function calculate() {
    const property = selected("property");
    const goal = selected("goal");
    const d = propertyDefaults[property];
    const bill = annualBill();
    const tariff = Number($("#usageRate").value) || d.rate;
    const feedIn = Number($("#feedInRate").value) || 0;
    const supply = Number($("#supplyCharge").value) || 0;
    const postcode = $("#postcode").value.trim();
    const state = stateFromPostcode(postcode);
    const yieldPerDay = Number($("#solarYield").value) || stateSettings[state].yield;
    const rise = (Number($("#priceRise").value) || 0) / 100;
    const dayShare = Number($("#dayUse").value) / 100;
    const fixedCost = supply * 365;
    const usage = Math.max(1000, (bill - fixedCost) / tariff);
    const goalFactor = goal === "independence" ? 1.10 : goal === "battery" ? 1.00 : .90;
    let solarKw = nextSystemSize((usage * goalFactor) / (yieldPerDay * 365), property);
    const existingSolar = selected("existingSolar");
    const existingSize = existingSolar === "yes" ? Number($("#existingSize").value) || 0 : 0;
    solarKw = Math.max(solarKw, existingSize);

    const generation = solarKw * yieldPerDay * 365;
    const daytimeLoad = usage * dayShare;
    const directSolar = Math.min(generation, daytimeLoad);
    const solarExport = Math.max(0, generation - directSolar);
    const solarImports = Math.max(0, usage - directSolar);
    const solarRunningCost = Math.max(0, solarImports * tariff + fixedCost - solarExport * feedIn);

    const eveningDaily = Math.max(0, usage - daytimeLoad) / 365;
    const surplusDaily = solarExport / 365;
    const rawBattery = Math.max(d.batteryMin, Math.min(eveningDaily * .82, surplusDaily * .9));
    const batteryKwh = roundBattery(rawBattery, property);
    const batteryChargeInput = Math.min(solarExport, batteryKwh * 365 * .88);
    const batteryDelivered = Math.min(solarImports, batteryChargeInput * .9);
    const batteryExports = Math.max(0, solarExport - batteryChargeInput);
    const batteryImports = Math.max(0, solarImports - batteryDelivered);
    const batteryRunningCost = Math.max(0, batteryImports * tariff + fixedCost - batteryExports * feedIn);

    const solarStc = solarStcEstimate(solarKw, state);
    const batteryStc = batteryStcEstimate(batteryKwh);
    const grossSolarCapital = d.solarBase + solarKw * d.solarPerKw;
    const grossBatteryCapital = d.batteryBase + batteryKwh * d.batteryPerKwh;
    const solarCapital = Math.max(0, grossSolarCapital - solarStc.value);
    const batteryCapital = Math.max(0, grossBatteryCapital - batteryStc.value);
    const totalCapital = solarCapital + batteryCapital;
    const solarSaving = Math.max(0, bill - solarRunningCost);
    const batterySaving = Math.max(0, bill - batteryRunningCost);
    const solarPayback = solarSaving ? solarCapital / solarSaving : Infinity;
    const batteryPayback = batterySaving ? totalCapital / batterySaving : Infinity;
    const degradation = .005;

    const grid10 = cumulativeCost(bill, 10, rise);
    const grid25 = cumulativeCost(bill, 25, rise);
    const solar10 = cumulativeCost({ grid: bill }, 10, rise, degradation, solarSaving, solarCapital);
    const solar25 = cumulativeCost({ grid: bill }, 25, rise, degradation, solarSaving, solarCapital);
    const battery10 = cumulativeCost({ grid: bill }, 10, rise, degradation, batterySaving, totalCapital);
    const battery25 = cumulativeCost({ grid: bill }, 25, rise, degradation, batterySaving, totalCapital);

    results = {
      date: new Date().toLocaleDateString("en-AU"), property, propertyLabel: d.label, goal, goalLabel: goalLabels[goal], postcode, state, stateName: stateSettings[state].name,
      bill, tariff, feedIn, supply, yieldPerDay, rise, dayShare, usage, solarKw, existingSolar, existingSize, generation, directSolar, solarExport, solarImports,
      batteryKwh, batteryChargeInput, batteryDelivered, batteryExports, batteryImports, solarRunningCost, batteryRunningCost,
      solarCapital, batteryCapital, totalCapital, grossSolarCapital, grossBatteryCapital, solarStc, batteryStc, modelledIncentives: solarStc.value + batteryStc.value,
      investmentLow: totalCapital * .9, investmentHigh: totalCapital * 1.15,
      solarSaving, batterySaving, solarPayback, batteryPayback, grid10, grid25, solar10, solar25, battery10, battery25,
      solarBenefit10: cumulativeBenefit(solarSaving, 10, rise, degradation, solarCapital), solarBenefit25: cumulativeBenefit(solarSaving, 25, rise, degradation, solarCapital),
      batteryBenefit10: cumulativeBenefit(batterySaving, 10, rise, degradation, totalCapital), batteryBenefit25: cumulativeBenefit(batterySaving, 25, rise, degradation, totalCapital),
      batteryPreference: selected("battery"), stateProgram: stateProgram(state, property, batteryKwh)
    };
    results.finance = financeRecommendation(property, state, totalCapital, true);
    window.solarAssessmentResults = results;
    renderResults();
    showStep(4);
  }

  function formatPayback(value) {
    return Number.isFinite(value) && value < 40 ? `${value.toFixed(1)} years` : "Review required";
  }

  function renderResults() {
    const r = results;
    $("#recommendedSystem").textContent = `${r.solarKw} kW solar system`;
    $("#recommendedBattery").textContent = `${r.batteryKwh} kWh`;
    $("#recommendationReason").textContent = `Sized as a starting point for a ${r.propertyLabel.toLowerCase()} using about ${number(r.usage)} kWh per year, with a focus on ${r.goalLabel}.`;
    $("#annualSavings").textContent = money(r.batterySaving);
    $("#paybackPeriod").textContent = formatPayback(r.batteryPayback);
    $("#tenYearBenefit").textContent = money(r.batteryBenefit10);
    $("#twentyFiveYearBenefit").textContent = money(r.batteryBenefit25);
    $("#gridAnnual").textContent = money(r.bill); $("#gridImports").textContent = `${number(r.usage)} kWh`;
    $("#solarAnnual").textContent = money(r.solarRunningCost); $("#solarAnnualSaving").textContent = money(r.solarSaving); $("#solarBenefit10").textContent = money(r.solarBenefit10); $("#solarBenefit25").textContent = money(r.solarBenefit25); $("#solarImports").textContent = `${number(r.solarImports)} kWh`;
    $("#batteryAnnual").textContent = money(r.batteryRunningCost); $("#batteryAnnualSaving").textContent = money(r.batterySaving); $("#batteryBenefit10").textContent = money(r.batteryBenefit10); $("#batteryBenefit25").textContent = money(r.batteryBenefit25); $("#batteryImports").textContent = `${number(r.batteryImports)} kWh`;
    const solarRate = clamp(r.solarSaving / r.bill * 100, 0, 100);
    const batteryRate = clamp(r.batterySaving / r.bill * 100, 0, 100);
    $("#gridVisualCost").textContent = money(r.bill);
    $("#solarVisualSaving").textContent = money(r.solarSaving); $("#solarVisualRate").textContent = `${solarRate.toFixed(0)}% of current bill`;
    $("#batteryVisualSaving").textContent = money(r.batterySaving); $("#batteryVisualRate").textContent = `${batteryRate.toFixed(0)}% of current bill`;
    $("#solarSavingBar").style.setProperty("--saving", `${solarRate}%`); $("#batterySavingBar").style.setProperty("--saving", `${batteryRate}%`);
    renderIncentives();
    renderFinance();
    drawCharts();
  }

  function incentiveCard(label, value, note, link, modelled) {
    return `<article><div><span>${modelled ? "Included" : "Eligibility check"}</span><b>${label}</b></div><strong>${value}</strong><p>${note}</p><a href="${link}" target="_blank" rel="noopener">Official program details ↗</a></article>`;
  }

  function renderIncentives() {
    const r = results;
    $("#modelledIncentives").textContent = money(r.modelledIncentives);
    $("#netSystemCost").textContent = money(r.totalCapital);
    $("#investmentRange").textContent = `${money(r.investmentLow)}–${money(r.investmentHigh)} indicative installed range`;
    const solarNote = r.solarStc.eligible ? `${r.solarStc.certificates} estimated STCs using a 2026 five-year deeming period and a $${STC_VALUE.toFixed(2)} certificate planning value.` : "Systems above 100 kW are not eligible for solar STCs; large-scale certificates may apply and require project assessment.";
    const cards = [
      incentiveCard("Federal solar STCs", money(r.solarStc.value), solarNote, sourceLinks.federal, true),
      incentiveCard("Federal battery STCs", money(r.batteryStc.value), `${r.batteryStc.certificates} estimated STCs using the May–December 2026 capacity taper.`, sourceLinks.battery, true),
      incentiveCard(r.stateProgram.title, r.stateProgram.value, r.stateProgram.note, r.stateProgram.link, false)
    ];
    $("#incentiveGrid").innerHTML = cards.join("");
  }

  function renderFinance() {
    const r = results;
    const f = r.finance;
    const monthlySaving = r.batterySaving / 12;
    const difference = monthlySaving - f.monthly;
    $("#financeBrand").textContent = f.brand;
    $("#financePathLabel").textContent = f.label;
    $("#financeMonthly").textContent = `${money(f.monthly)}/month`;
    $("#financeTerm").textContent = f.term;
    $("#monthlySaving").textContent = `${money(monthlySaving)}/month`;
    $("#financeDifference").textContent = difference >= 0 ? `${money(difference)} estimated positive monthly difference` : `${money(Math.abs(difference))} more than estimated savings during finance term`;
    $("#financeDisclaimer").innerHTML = `${f.note} <a href="${f.link}" target="_blank" rel="noopener">Provider details ↗</a> Finance estimates are general information, not a quote or financial advice.`;
  }

  function chartDefaults() {
    Chart.defaults.font.family = "DM Sans, Arial, sans-serif";
    Chart.defaults.color = "#64757b";
    Chart.defaults.borderColor = "rgba(16,37,45,.08)";
  }

  function destroyCharts() {
    Object.values(charts).forEach((chart) => chart?.destroy());
    charts = {};
  }

  function drawCharts() {
    if (!window.Chart || !results) return;
    chartDefaults();
    destroyCharts();
    const common = { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true, font: { size: 10 } } }, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label || ctx.label}: ${ctx.dataset.yAxisID === "energy" ? number(ctx.raw) + " kWh" : money(ctx.raw)}` } } } };
    charts.billSavings = new Chart($("#billSavingsChart"), { type: "bar", data: { labels: ["Current bill", "Solar only", "Solar + battery"], datasets: [{ label: "Estimated saving", data: [0, results.solarSaving, results.batterySaving], backgroundColor: ["#d7dfe0", "#ffb53d", "#0a7b78"], borderRadius: 7, barThickness: 30 }, { label: "Remaining energy cost", data: [results.bill, results.solarRunningCost, results.batteryRunningCost], backgroundColor: "#d7dfe0", borderRadius: 7, barThickness: 30 }] }, options: { ...common, indexAxis: "y", scales: { x: { stacked: true, beginAtZero: true, max: Math.ceil(results.bill / 500) * 500, ticks: { callback: (v) => `$${number(v)}` } }, y: { stacked: true, grid: { display: false } } }, plugins: { ...common.plugins, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${money(ctx.raw)}` } } } } });
    charts.cost = new Chart($("#costChart"), { type: "bar", data: { labels: ["Grid only", "Solar only", "Solar + battery"], datasets: [{ label: "Year 1 cost", data: [results.bill, results.solarRunningCost, results.batteryRunningCost], backgroundColor: ["#a8b4b7", "#ffb53d", "#0a7b78"], borderRadius: 6, maxBarThickness: 42 }] }, options: { ...common, scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${number(v)}` } }, x: { grid: { display: false } } }, plugins: { ...common.plugins, legend: { display: false } } } });

    const years = Array.from({ length: 25 }, (_, i) => i + 1);
    const solarBenefits = years.map((year) => cumulativeBenefit(results.solarSaving, year, results.rise, .005, results.solarCapital));
    const batteryBenefits = years.map((year) => cumulativeBenefit(results.batterySaving, year, results.rise, .005, results.totalCapital));
    charts.savings = new Chart($("#savingsChart"), { type: "line", data: { labels: years, datasets: [{ label: "Solar only", data: solarBenefits, borderColor: "#ffb53d", backgroundColor: "rgba(255,181,61,.08)", tension: .3, pointRadius: 0, borderWidth: 2 }, { label: "Solar + battery", data: batteryBenefits, borderColor: "#0a7b78", backgroundColor: "rgba(10,123,120,.08)", tension: .3, pointRadius: 0, borderWidth: 2 }] }, options: { ...common, scales: { y: { ticks: { callback: (v) => `$${number(v)}` } }, x: { grid: { display: false }, title: { display: true, text: "Year", font: { size: 9 } } } } } });

    charts.energy = new Chart($("#energyChart"), { type: "bar", data: { labels: ["Grid only", "Solar only", "Solar + battery"], datasets: [{ label: "Direct solar", data: [0, results.directSolar, results.directSolar], backgroundColor: "#ffb53d", stack: "energy", yAxisID: "energy" }, { label: "Battery", data: [0, 0, results.batteryDelivered], backgroundColor: "#0a7b78", stack: "energy", yAxisID: "energy" }, { label: "Grid", data: [results.usage, results.solarImports, results.batteryImports], backgroundColor: "#a8b4b7", stack: "energy", yAxisID: "energy" }] }, options: { ...common, indexAxis: "y", scales: { x: { stacked: true, ticks: { callback: (v) => `${number(v)} kWh` } }, y: { stacked: true, grid: { display: false } } } } });

    const hours = ["12am", "3am", "6am", "9am", "12pm", "3pm", "6pm", "9pm", "12am"];
    const solarProfile = [0, 0, 0.05, .45, 1, .72, .12, 0, 0].map((v) => v * results.solarKw);
    const batteryProfile = [.28, .2, .08, 0, -.35, -.55, .32, .62, .28].map((v) => v * Math.min(results.batteryKwh / 4, results.solarKw));
    charts.battery = new Chart($("#batteryChart"), { type: "line", data: { labels: hours, datasets: [{ label: "Solar output", data: solarProfile, borderColor: "#ffb53d", backgroundColor: "rgba(255,181,61,.1)", fill: true, tension: .35, pointRadius: 0 }, { label: "Battery charge / discharge", data: batteryProfile, borderColor: "#0a7b78", backgroundColor: "rgba(10,123,120,.08)", fill: true, tension: .35, pointRadius: 0 }] }, options: { ...common, scales: { y: { ticks: { callback: (v) => `${v.toFixed(0)} kW` } }, x: { grid: { display: false } } } } });
  }

  function validateLead() {
    const name = $("#leadName").value.trim();
    const phone = $("#leadPhone").value.trim();
    const email = $("#leadEmail").value.trim();
    const booking = $("#bookCall").checked;
    const date = $("#appointmentDate").value;
    const time = $("#appointmentTime").value;
    const billFile = $("#billFile").files?.[0];
    let error = "";
    if (!name || !phone || !/^\S+@\S+\.\S+$/.test(email)) error = "Please enter your name, mobile number and a valid email address.";
    else if (!$("#consent").checked) error = "Please confirm that Mark may contact you about this assessment.";
    else if (booking && (!date || !time)) error = "Please select a preferred appointment date and time.";
    else if (booking && [0, 6].includes(new Date(`${date}T12:00:00`).getDay())) error = "Please choose a weekday for your telephone appointment.";
    else if (booking && billFile && billFile.size > 10 * 1024 * 1024) error = "Please choose an energy bill smaller than 10 MB.";
    else if (booking && billFile && !["application/pdf", "image/jpeg", "image/png"].includes(billFile.type)) error = "Energy bills must be a PDF, JPG or PNG file.";
    $("#leadError").textContent = error;
    return !error;
  }

  function getLeadData(billUpload = null) {
    return {
      submittedAt: new Date().toLocaleString("en-AU", { timeZone: TIMEZONE }),
      name: $("#leadName").value.trim(), phone: $("#leadPhone").value.trim(), email: $("#leadEmail").value.trim(),
      postcode: results.postcode, property: results.propertyLabel, goal: results.goalLabel,
      annualBill: Math.round(results.bill), estimatedUsageKwh: Math.round(results.usage), solarRecommendationKw: results.solarKw,
      batteryRecommendationKwh: results.batteryKwh, estimatedAnnualSavings: Math.round(results.batterySaving), estimatedPaybackYears: Number.isFinite(results.batteryPayback) ? Number(results.batteryPayback.toFixed(1)) : "Review required",
      state: results.state, estimatedFederalIncentives: Math.round(results.modelledIncentives), estimatedSystemInvestment: Math.round(results.totalCapital), possibleStateProgram: results.stateProgram.title,
      possibleFinanceProvider: results.finance.brand, possibleFinanceMonthly: Math.round(results.finance.monthly), financeCaveat: results.finance.note,
      appointmentRequested: $("#bookCall").checked ? "Yes" : "No", appointmentDate: $("#bookCall").checked ? $("#appointmentDate").value : "", appointmentTime: $("#bookCall").checked ? $("#appointmentTime").value : "",
      billFileName: billUpload?.filename || "", billUploadUrl: billUpload?.url || "", billUploaded: billUpload ? "Yes" : "No",
      source: "Solar Savings Calculator"
    };
  }

  async function uploadBill(file) {
    if (!file) return null;
    if (IS_AGENT_PREVIEW) return { filename: file.name, url: "Preview upload" };
    const data = new FormData();
    data.append("bill", file);
    const response = await fetch(BILL_UPLOAD_URL, { method: "POST", body: data });
    if (!response.ok) throw new Error("Bill upload failed");
    return response.json();
  }

  function addMinutes(date, time, minutes) {
    const [hour, minute] = time.split(":").map(Number);
    const start = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
    return new Date(start.getTime() + minutes * 60000);
  }

  function calendarDate(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  }

  function makeCalendarUrl(lead) {
    if (lead.appointmentRequested !== "Yes") return "";
    const start = new Date(`${lead.appointmentDate}T${lead.appointmentTime}:00`);
    const end = addMinutes(lead.appointmentDate, lead.appointmentTime, 30);
    const details = [`Telephone solar consultation with Mark Fitzpatrick`, `Lead: ${lead.name}`, `Phone: ${lead.phone}`, `Email: ${lead.email}`, `Property: ${lead.property}`, `Postcode: ${lead.postcode}`, `Estimate: ${lead.solarRecommendationKw} kW solar + ${lead.batteryRecommendationKwh} kWh battery`, lead.billUploadUrl ? `Energy bill: ${lead.billUploadUrl}` : "", `This requested time is subject to confirmation.`].filter(Boolean).join("\n");
    const params = new URLSearchParams({ action: "TEMPLATE", text: `Solar telephone consultation — ${lead.name}`, dates: `${calendarDate(start)}/${calendarDate(end)}`, ctz: TIMEZONE, details, location: `Telephone call to ${lead.phone}`, add: CONTACT_EMAIL });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  async function sendLead(lead) {
    localStorage.setItem("solarAssessmentLead", JSON.stringify(lead));
    try {
      await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(lead) });
      return true;
    } catch (error) {
      console.warn("Lead endpoint unavailable", error);
      return false;
    }
  }

  async function imageData(url) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const cropTop = Math.round(image.naturalHeight * .2);
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight - cropTop;
        canvas.getContext("2d").drawImage(image, 0, cropTop, image.naturalWidth, image.naturalHeight - cropTop, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => resolve("");
      image.src = url;
    });
  }

  function pdfHeader(doc, title, page) {
    doc.setFillColor(6, 47, 63); doc.rect(0, 0, 210, 18, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("SOLAR SAVINGS ASSESSMENT", 16, 11.5);
    doc.setTextColor(16, 37, 45); doc.setFontSize(20); doc.text(title, 16, 33);
    doc.setDrawColor(223, 231, 231); doc.line(16, 40, 194, 40);
    doc.setTextColor(100, 117, 123); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(`Mark Fitzpatrick · ${CONTACT_PHONE} · ${CONTACT_EMAIL}`, 16, 286); doc.text(String(page), 192, 286, { align: "right" });
  }

  function pdfCard(doc, x, y, w, label, value, note = "") {
    doc.setFillColor(245, 248, 247); doc.roundedRect(x, y, w, 27, 3, 3, "F");
    doc.setTextColor(100, 117, 123); doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.text(label.toUpperCase(), x + 5, y + 7);
    doc.setTextColor(10, 123, 120); doc.setFontSize(15); doc.text(String(value), x + 5, y + 17);
    if (note) { doc.setTextColor(100, 117, 123); doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.text(note, x + 5, y + 23); }
  }

  async function generatePdf(lead) {
    if (!window.jspdf) throw new Error("The PDF library did not load. Please refresh and try again.");
    if (!results) throw new Error("Calculator results are unavailable. Please recalculate and try again.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const photo = await imageData("mark-photo.jpg");

    doc.setFillColor(6, 47, 63); doc.rect(0, 0, 210, 297, "F");
    doc.setFillColor(200, 239, 110); doc.circle(181, 28, 22, "F");
    doc.setFillColor(255, 181, 61); doc.circle(181, 28, 9, "F");
    doc.setTextColor(200, 239, 110); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("PERSONALISED ENERGY ASSESSMENT", 18, 38);
    doc.setTextColor(255, 255, 255); doc.setFontSize(31); doc.text(["Your solar", "savings report."], 18, 65, { lineHeightFactor: 1.05 });
    doc.setTextColor(183, 205, 210); doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.text(`Prepared for ${lead.name}`, 18, 96); doc.setFontSize(9); doc.text(`${results.propertyLabel} · ${results.postcode} · ${results.date}`, 18, 104);
    doc.setFillColor(10, 64, 81); doc.roundedRect(18, 126, 174, 58, 5, 5, "F");
    doc.setTextColor(169, 195, 200); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("RECOMMENDED STARTING POINT", 28, 141);
    doc.setTextColor(200, 239, 110); doc.setFontSize(22); doc.text(`${results.solarKw} kW solar`, 28, 156);
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.text(`with ${results.batteryKwh} kWh battery comparison`, 28, 168);
    if (photo) { doc.setFillColor(236, 240, 238); doc.roundedRect(130, 203, 62, 76, 4, 4, "F"); doc.addImage(photo, "PNG", 132, 205, 58, 72, undefined, "FAST"); }
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text("Mark Fitzpatrick", 18, 232); doc.setTextColor(183, 205, 210); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text("Renewable Energy Specialist", 18, 241); doc.text(CONTACT_PHONE, 18, 252); doc.text(CONTACT_EMAIL, 18, 260);

    doc.addPage(); pdfHeader(doc, "Your opportunity at a glance", 2);
    doc.setFillColor(6, 47, 63); doc.roundedRect(16, 47, 178, 37, 4, 4, "F"); doc.setTextColor(169, 195, 200); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("SYSTEM RECOMMENDATION", 23, 58); doc.setTextColor(200, 239, 110); doc.setFontSize(19); doc.text(`${results.solarKw} kW solar + ${results.batteryKwh} kWh battery`, 23, 71); doc.setTextColor(214, 227, 229); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text(`Starting point for a ${results.propertyLabel.toLowerCase()} focused on ${results.goalLabel}.`, 23, 78);
    pdfCard(doc, 16, 92, 42, "Annual savings", money(results.batterySaving), "Solar + battery"); pdfCard(doc, 62, 92, 42, "Payback", formatPayback(results.batteryPayback), "Planning estimate"); pdfCard(doc, 108, 92, 42, "10-year benefit", money(results.batteryBenefit10), "Net of system cost"); pdfCard(doc, 154, 92, 40, "25-year benefit", money(results.batteryBenefit25), "Net of system cost");
    doc.setTextColor(16, 37, 45); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Scenario comparison", 16, 138);
    const rows = [
      ["Grid only", money(results.bill), "—", "—", "—"],
      ["Solar only", money(results.solarRunningCost), money(results.solarSaving), money(results.solarBenefit10), money(results.solarBenefit25)],
      ["Solar + battery", money(results.batteryRunningCost), money(results.batterySaving), money(results.batteryBenefit10), money(results.batteryBenefit25)]
    ];
    const cols = ["Scenario", "Year 1", "Annual saving", "10y net benefit", "25y net benefit"];
    let y = 147; doc.setFillColor(239, 244, 243); doc.rect(16, y, 178, 10, "F"); doc.setFontSize(7); doc.setTextColor(100,117,123); cols.forEach((c, i) => doc.text(c, [20,79,111,149,190][i], y + 6, i ? { align: "right" } : undefined)); y += 10;
    rows.forEach((row, ri) => { if (ri === 2) { doc.setFillColor(240, 248, 244); doc.rect(16, y, 178, 13, "F"); } doc.setTextColor(16,37,45); doc.setFont("helvetica", ri === 2 ? "bold" : "normal"); row.forEach((c, i) => doc.text(c, [20,79,111,149,190][i], y + 8, i ? { align: "right" } : undefined)); doc.setDrawColor(223,231,231); doc.line(16, y + 13, 194, y + 13); y += 13; });
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Key energy estimates", 16, 212);
    const estimates = [`Annual electricity use: ${number(results.usage)} kWh`, `Solar generation: ${number(results.generation)} kWh/year`, `Solar used directly: ${number(results.directSolar)} kWh/year`, `Solar delivered from battery: ${number(results.batteryDelivered)} kWh/year`, `Modelled federal STC discount: ${money(results.modelledIncentives)}`, `Estimated solar + battery investment after modelled STCs: ${money(results.totalCapital)}`];
    doc.setFont("helvetica", "normal"); doc.setTextColor(71, 93, 99); doc.setFontSize(8.5); doc.text(estimates, 20, 224, { lineHeightFactor: 1.75 });

    doc.addPage(); pdfHeader(doc, "Costs and long-term benefit", 3);
    const costImage = charts.billSavings?.toBase64Image(); const savingsImage = charts.savings?.toBase64Image();
    if (costImage) { doc.setFont("helvetica", "bold"); doc.setTextColor(16,37,45); doc.setFontSize(11); doc.text("Current bill vs estimated savings", 16, 51); doc.addImage(costImage, "PNG", 16, 57, 83, 74); }
    if (savingsImage) { doc.setFont("helvetica", "bold"); doc.setTextColor(16,37,45); doc.setFontSize(11); doc.text("25-year cumulative net benefit", 109, 51); doc.addImage(savingsImage, "PNG", 109, 57, 85, 74); }
    const energyImage = charts.energy?.toBase64Image(); const batteryImage = charts.battery?.toBase64Image();
    if (energyImage) { doc.setFont("helvetica", "bold"); doc.setTextColor(16,37,45); doc.setFontSize(11); doc.text("Where your energy comes from", 16, 150); doc.addImage(energyImage, "PNG", 16, 156, 83, 74); }
    if (batteryImage) { doc.setFont("helvetica", "bold"); doc.setTextColor(16,37,45); doc.setFontSize(11); doc.text("Typical battery profile", 109, 150); doc.addImage(batteryImage, "PNG", 109, 156, 85, 74); }
    doc.setFillColor(245,242,233); doc.roundedRect(16, 245, 178, 26, 3, 3, "F"); doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text("Graphs are indicative and use the assumptions selected in the calculator. A detailed assessment using interval data is required before a final recommendation.", 22, 257, { maxWidth: 166 });

    doc.addPage(); pdfHeader(doc, "Your practical energy plan", 4);
    const sections = [
      ["01", "Why this system was recommended", `The starting size balances around ${number(results.usage)} kWh of annual use, ${Math.round(results.dayShare * 100)}% estimated daytime demand, export value and your goal to ${results.goalLabel}.`],
      ["02", "How your system works", "Solar power supplies active loads first. Suitable excess solar can charge the battery. Stored energy can then support evening use before more power is imported from the grid."],
      ["03", "Installation journey", "Review recent bills and interval data. Confirm the switchboard, roof, shading and network requirements. Finalise equipment and design, obtain approvals, install, commission and provide ongoing support."],
      ["04", "Long-term energy strategy", "Allow for future loads such as EV charging, electric hot water, air conditioning, machinery or business growth. Review tariffs and battery operation as electricity use changes."]
    ];
    y = 50;
    sections.forEach(([n, title, body]) => { doc.setFillColor(6,47,63); doc.circle(25, y + 7, 7, "F"); doc.setTextColor(200,239,110); doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.text(n, 25, y + 9, { align: "center" }); doc.setTextColor(16,37,45); doc.setFontSize(12); doc.text(title, 38, y + 5); doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); const lines = doc.splitTextToSize(body, 150); doc.text(lines, 38, y + 15, { lineHeightFactor: 1.45 }); y += 52; });
    doc.setFillColor(223,244,232); doc.roundedRect(16, 252, 178, 22, 3, 3, "F"); doc.setTextColor(6,47,63); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("Next step: review the estimate with Mark", 22, 261); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text(`${CONTACT_PHONE}  ·  ${CONTACT_EMAIL}`, 22, 268);

    doc.addPage(); pdfHeader(doc, "Assumptions and important notes", 5);
    doc.setTextColor(16,37,45); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Calculator assumptions", 16, 51);
    const assumptions = [`Electricity tariff: $${results.tariff.toFixed(3)}/kWh`, `Feed-in tariff: $${results.feedIn.toFixed(3)}/kWh`, `Daily supply charge: $${results.supply.toFixed(2)}`, `Postcode-based solar yield: ${results.yieldPerDay.toFixed(1)} kWh/kW/day`, `Electricity price rise: ${(results.rise * 100).toFixed(1)}% per year`, `Solar output reduction: 0.5% per year`, `Battery round-trip efficiency: approximately 90%`, `STC planning value: $${STC_VALUE.toFixed(2)} per certificate`];
    doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(assumptions.map((item) => `• ${item}`), 20, 64, { lineHeightFactor: 1.7 });
    doc.setFillColor(240,248,244); doc.roundedRect(16, 122, 178, 50, 4, 4, "F"); doc.setTextColor(10,123,120); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Incentives and possible finance", 23, 136); doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(doc.splitTextToSize(`Federal STCs modelled: ${money(results.modelledIncentives)}. State pathway: ${results.stateProgram.title} — ${results.stateProgram.value}. Possible finance: ${results.finance.brand}, approximately ${money(results.finance.monthly)}/month (${results.finance.term}). Eligibility and final provider terms apply.`, 162), 23, 147, { lineHeightFactor: 1.4 });
    doc.setFillColor(245,242,233); doc.roundedRect(16, 182, 178, 54, 4, 4, "F"); doc.setTextColor(16,37,45); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Important", 23, 196); doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(8); const disclaimer = "This report is an initial planning estimate and general information only. It is not financial advice, an engineering design, a guarantee of savings or a formal quotation. Actual performance and returns depend on interval consumption data, roof space, orientation, shading, weather, network approval, tariffs, equipment, installation conditions and final installed price. Federal certificate values vary. Conditional state incentives, finance costs, fees and tax effects require confirmation."; doc.text(doc.splitTextToSize(disclaimer, 162), 23, 207, { lineHeightFactor: 1.4 });
    if (lead.appointmentRequested === "Yes") { doc.setFillColor(240,248,244); doc.roundedRect(16, 245, 178, 30, 4, 4, "F"); doc.setTextColor(10,123,120); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("Telephone appointment requested", 23, 257); doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text(`${new Date(`${lead.appointmentDate}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} at ${lead.appointmentTime}${lead.billUploaded === "Yes" ? " · energy bill uploaded" : ""}`, 23, 267); }

    const safeName = lead.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "Customer";
    const filename = `Solar_Savings_Assessment_${safeName}.pdf`;
    const blob = doc.output("blob");
    if (latestPdfUrl) URL.revokeObjectURL(latestPdfUrl);
    latestPdfUrl = URL.createObjectURL(blob);
    return { filename, url: latestPdfUrl };
  }

  function downloadPdf(pdf) {
    const link = document.createElement("a");
    link.href = pdf.url;
    link.download = pdf.filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function submitLead() {
    if (!results || !validateLead()) return;
    const wantsBooking = $("#bookCall").checked;
    const calendarWindow = wantsBooking && !IS_AGENT_PREVIEW ? window.open("about:blank", "_blank") : null;
    $("#submitLead").disabled = true; $("#submitLead").textContent = "Preparing your report…";
    let billUpload = null;
    try {
      billUpload = wantsBooking ? await uploadBill($("#billFile").files?.[0]) : null;
    } catch {
      calendarWindow?.close();
      $("#leadError").textContent = "Your bill could not be uploaded. Please try again, choose a smaller file, or remove it to continue.";
      $("#submitLead").disabled = false; $("#submitLead").innerHTML = "Download my report <span>↓</span>";
      return;
    }
    const lead = getLeadData(billUpload);
    calendarUrl = makeCalendarUrl(lead);
    let pdf;
    try {
      pdf = await generatePdf(lead);
      downloadPdf(pdf);
    } catch (error) {
      calendarWindow?.close();
      $("#leadError").textContent = error?.message || "The report could not be created. Please refresh and try again.";
      $("#submitLead").disabled = false; $("#submitLead").innerHTML = "Download my report <span>↓</span>";
      return;
    }
    if (calendarWindow && calendarUrl) calendarWindow.location.href = calendarUrl;
    $("#leadFormFields").classList.add("hidden"); $("#successPanel").classList.remove("hidden");
    $("#downloadAgain").href = pdf.url; $("#downloadAgain").download = pdf.filename;
    $("#successMessage").textContent = `Your report is ready. If the download did not start automatically, use the Download report button below${wantsBooking ? ". Your Google Calendar invitation is also ready" : ""}.`;
    if (calendarUrl) { $("#calendarLink").href = calendarUrl; $("#calendarLink").classList.remove("hidden"); }
    $("#successPanel").focus();
    const sent = IS_AGENT_PREVIEW ? true : await sendLead(lead);
    if (!sent) $("#successMessage").textContent += ` Your report is safe, but the enquiry could not be sent automatically. Please call ${CONTACT_PHONE}.`;
  }

  function setMinDate() {
    const date = new Date(); date.setDate(date.getDate() + 1);
    const pad = (n) => String(n).padStart(2, "0");
    $("#appointmentDate").min = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function init() {
    $("#year").textContent = new Date().getFullYear();
    setMinDate();
    $$('[data-next]').forEach((button) => button.addEventListener("click", () => { const next = Number(button.dataset.next); if (validateStep(currentStep)) showStep(next); }));
    $$('[data-back]').forEach((button) => button.addEventListener("click", () => showStep(Number(button.dataset.back))));
    $$("input[name='property']").forEach((input) => input.addEventListener("change", () => updateDefaults(input.value)));
    $("#postcode").addEventListener("change", applyPostcodeYield);
    $$("input[name='existingSolar']").forEach((input) => input.addEventListener("change", () => $("#existingSizeWrap").classList.toggle("hidden", input.value !== "yes")));
    $("#calculateButton").addEventListener("click", () => { if (validateStep(1) && validateStep(2)) calculate(); else showStep(!validateStep(1) ? 1 : 2); });
    $("#bookCall").addEventListener("change", (event) => $("#bookingFields").classList.toggle("hidden", !event.target.checked));
    $("#billFile").addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      const upload = event.target.closest(".bill-upload");
      upload.classList.toggle("has-file", Boolean(file));
      const details = upload.querySelector("small");
      details.textContent = file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : "PDF, JPG or PNG · maximum 10 MB";
    });
    $("#submitLead").addEventListener("click", submitLead);
    $("#printSummary").addEventListener("click", () => window.print());
    $("#restartCalculator").addEventListener("click", () => { location.reload(); });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
