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
    home: { label: "Home", residential: true, rate: .35, supply: 1.2, day: 40, min: 3.3, max: 30, batteryMax: 50, solarBase: 800, solarPerKw: 1050, batteryBase: 1800, batteryPerKwh: 1050 },
    apartment: { label: "Unit or apartment", residential: true, rate: .35, supply: 1.2, day: 40, min: 3.3, max: 15, batteryMax: 30, solarBase: 950, solarPerKw: 1150, batteryBase: 1900, batteryPerKwh: 1080 },
    grouped: { label: "Grouped residences", residential: true, grouped: true, rate: .31, supply: 3.2, day: 55, min: 10, max: 100, batteryMax: 100, solarBase: 4200, solarPerKw: 900, batteryBase: 5200, batteryPerKwh: 860 },
    business: { label: "Business", rate: .30, supply: 2.2, day: 70, min: 6.6, max: 100, batteryMax: 150, solarBase: 3000, solarPerKw: 930, batteryBase: 4500, batteryPerKwh: 900 },
    commercial: { label: "Commercial", rate: .27, supply: 4.0, day: 78, min: 20, max: 500, batteryMax: 750, solarBase: 7000, solarPerKw: 790, batteryBase: 9000, batteryPerKwh: 760 },
    farm: { label: "Farm", rate: .31, supply: 2.8, day: 67, min: 10, max: 250, batteryMax: 300, solarBase: 4800, solarPerKw: 860, batteryBase: 6000, batteryPerKwh: 820 }
  };

  const STC_VALUE = 38.5;
  const SOLAR_DEEMING_YEARS = 5;
  const BATTERY_STC_FACTOR = 6.8;
  const stateSettings = {
    NSW: { name: "New South Wales" }, ACT: { name: "Australian Capital Territory" }, VIC: { name: "Victoria" }, QLD: { name: "Queensland" },
    SA: { name: "South Australia" }, WA: { name: "Western Australia" }, TAS: { name: "Tasmania" }, NT: { name: "Northern Territory" }
  };
  const zoneRatings = { 1: 1.622, 2: 1.536, 3: 1.382, 4: 1.185 };
  const zoneDailyYield = { 1: 4.45, 2: 4.21, 3: 3.79, 4: 3.25 };
  const postcodeZones = [
    [0,799,3],[800,853,2],[854,854,3],[855,861,2],[862,862,3],[863,869,2],[870,879,1],[880,885,3],[886,1000,2],
    [1001,2355,3],[2356,2357,2],[2358,2384,3],[2385,2389,2],[2390,2395,3],[2396,2397,2],[2398,2399,3],[2400,2400,2],[2401,2404,3],[2405,2407,2],[2408,2544,3],
    [2545,2554,4],[2555,2627,3],[2628,2628,4],[2629,2629,3],[2630,2639,4],[2640,2816,3],[2817,2817,2],[2818,2820,3],[2821,2829,2],[2830,2830,3],[2831,2841,2],[2842,2872,3],[2873,2873,2],[2874,2877,3],[2878,2889,2],[2890,2999,3],
    [3000,3035,4],[3036,3038,3],[3039,3044,4],[3045,3045,3],[3046,3046,4],[3047,3049,3],[3050,3058,4],[3059,3059,3],[3060,3060,4],[3061,3064,3],[3065,3074,4],[3075,3076,3],[3077,3098,4],[3099,3099,3],[3100,3292,4],[3293,3302,3],[3303,3308,4],[3309,3319,3],[3320,3333,4],[3334,3337,3],[3338,3339,4],[3340,3758,3],[3759,3760,4],[3761,3764,3],[3765,3999,4],
    [4000,4416,3],[4417,4417,2],[4418,4427,3],[4428,4473,2],[4474,4476,1],[4477,4478,2],[4479,4485,1],[4486,4491,2],[4492,4492,1],[4493,4493,2],[4494,4494,3],[4495,4497,2],[4498,4719,3],[4720,4722,2],[4723,4723,3],[4724,4734,2],[4735,4736,1],[4737,4822,3],[4823,4823,2],[4824,4824,3],[4825,4827,2],[4828,4828,3],[4829,4829,1],[4830,5431,3],
    [5432,5450,2],[5451,5654,3],[5655,5669,2],[5670,5679,3],[5680,5699,2],[5700,5709,3],[5710,5722,2],[5723,5724,1],[5725,5730,2],[5731,5731,1],[5732,5732,2],[5733,5799,1],
    [5800,6043,3],[6044,6044,2],[6045,6256,3],[6257,6270,4],[6271,6316,3],[6317,6349,4],[6350,6353,3],[6354,6356,4],[6357,6394,3],[6395,6400,4],[6401,6430,3],[6431,6431,2],[6432,6433,3],[6434,6440,2],[6441,6441,1],[6442,6444,3],[6445,6459,4],[6460,6467,3],[6468,6469,2],[6470,6471,3],[6472,6472,2],[6473,6506,3],[6507,6508,2],[6509,6509,3],[6510,6536,2],[6537,6537,1],[6538,6555,2],[6556,6573,3],[6574,6602,2],[6603,6607,3],[6608,6641,2],[6642,6724,1],[6725,6750,2],[6751,6764,1],[6765,6765,2],[6766,6797,1],[6798,6799,2],[6800,6999,3],
    [7000,8999,4],[9000,9999,3]
  ];

  const sourceLinks = {
    federal: "https://cer.gov.au/schemes/renewable-energy-target/small-scale-renewable-energy-scheme/small-scale-technology-certificates/calculate-small-scale-technology-certificate-entitlements",
    battery: "https://cer.gov.au/news-and-media/news/2026/february/changes-to-rebate-solar-batteries-1-may",
    expansion: "https://cer.gov.au/schemes/renewable-energy-target/small-scale-renewable-energy-scheme/small-scale-technology-certificates",
    vic: "https://www.solar.vic.gov.au/solar-panel-rebate",
    vicApartments: "https://www.solar.vic.gov.au/apartments",
    vicCommercial: "https://www.solar.vic.gov.au/commercial-and-industrial-solar",
    nsw: "https://www.energy.nsw.gov.au/households/grants-rebates/household-energy-saving-upgrades/virtual-power-plant-vpp-incentive",
    nswHome: "https://www.energy.nsw.gov.au/households/grants-rebates/home-energy-saver",
    nswApartments: "https://www.energy.nsw.gov.au/households/grants-rebates/solar-for-apartment-residents",
    qldRenters: "https://www.qld.gov.au/housing/home-energy-savings/supercharged-solar-for-renters",
    wa: "https://www.wa.gov.au/organisation/energy-policy-wa/wa-residential-battery-scheme",
    act: "https://www.climatechoices.act.gov.au/policy-programs/sustainable-household-scheme",
    actSupport: "https://www.climatechoices.act.gov.au/policy-programs/home-energy-support-rebates-for-homeowners",
    actApartments: "https://www.climatechoices.act.gov.au/policy-programs/solar-for-apartments-program",
    solarSharer: "https://www.energy.gov.au/rebates/solar-sharer-offer",
    saVpp: "https://www.energymining.sa.gov.au/consumers/solar-and-batteries/south-australias-virtual-power-plant",
    saAdelaide: "https://www.energy.gov.au/rebates/incentives-sustainability",
    heuf: "https://www.energy.gov.au/rebates/household-energy-upgrades-fund",
    nationalFinder: "https://www.energy.gov.au/rebates",
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

  function solarZoneFromPostcode(postcode) {
    const pc = Number(postcode);
    return postcodeZones.find(([from, to]) => pc >= from && pc <= to)?.[2] || 3;
  }

  function locationProfile(postcode) {
    const state = stateFromPostcode(postcode);
    const zone = solarZoneFromPostcode(postcode);
    return { state, zone, zoneRating: zoneRatings[zone], yieldPerDay: zoneDailyYield[zone] };
  }

  function applyPostcodeYield() {
    const postcode = $("#postcode").value.trim();
    if (!/^\d{4}$/.test(postcode)) return;
    $("#solarYield").value = locationProfile(postcode).yieldPerDay.toFixed(2);
  }

  function solarStcEstimate(solarKw, zoneRating) {
    if (!solarKw || solarKw >= 100) return { certificates: 0, value: 0, eligible: false };
    const certificates = Math.floor(solarKw * zoneRating * SOLAR_DEEMING_YEARS);
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

  function supportProgram(title, value, note, link, status = "Eligibility check") {
    return { title, value, note, link, status };
  }

  function statePrograms(state, property, batteryKwh, postcode, solarKw) {
    const d = propertyDefaults[property];
    const residential = Boolean(d.residential);
    const grouped = Boolean(d.grouped);
    const programs = [];
    if (state === "NSW") {
      if (residential) programs.push(supportProgram("NSW Home Energy Saver", "0% loan up to $15,000", "Loans are open for eligible owners and landlords with household income up to $210,000. A discount up to $4,000 for eligible lower-income households is coming soon and is not deducted here.", sourceLinks.nswHome, "Loan open"));
      if (batteryKwh > 2 && batteryKwh <= 50 && property !== "commercial") programs.push(supportProgram("NSW VPP incentive", "Provider payment", "Homes and small businesses may receive an upfront payment for joining an eligible virtual power plant. The value depends on the provider and battery capacity up to 28 kWh.", sourceLinks.nsw, "Open now"));
      if (grouped) programs.push(supportProgram("NSW Solar for Apartment Residents", "50% up to $150,000", "Owners corporations or strata managers can apply for shared solar. Boost can cover 80% up to $200,000 in selected suburbs. Applications close 4 December 2026 or when funds are used.", sourceLinks.nswApartments, "Open now"));
    }
    if (state === "VIC") {
      if (property === "home" || property === "apartment") programs.push(supportProgram("Victoria Solar Homes", "Up to $1,400 + loan", "Eligible households can receive up to $1,400 for solar and choose a matching interest-free loan. The household income cap is $150,000 and the property must meet the rules.", sourceLinks.vic, "Open now"));
      if (grouped) programs.push(supportProgram("Victoria Solar for Apartments", "$2,800 per home", "Owners corporations may receive up to $2,800 per apartment, capped at $140,000 per property. Open to 30 June 2027 or until funds are used.", sourceLinks.vicApartments, "Open now"));
      if (!residential && solarKw >= 30) programs.push(supportProgram("Victorian Energy Upgrades solar", "Upfront VEU discount", "Victorian businesses and non-residential sites may receive an upfront discount for eligible 30–200 kW solar systems installed by an accredited provider.", sourceLinks.vicCommercial, "Open now"));
    }
    if (state === "QLD" && (property === "home" || property === "apartment")) programs.push(supportProgram("Queensland solar for renters", "Up to $3,500", "Eligible landlords can receive a rebate for solar on a currently rented Class 1a home with rent of $1,000 a week or less. Existing solar and embedded networks are excluded.", sourceLinks.qldRenters, "Open now"));
    if (state === "WA" && residential && batteryKwh >= 5) programs.push(supportProgram("WA Residential Battery Scheme", "$1,300–$3,800 max", "Up to $1,300 for Synergy customers or $3,800 for Horizon Power customers. A no-interest loan up to $10,000 may also be available. VPP participation and approved products apply.", sourceLinks.wa, "Open now"));
    if (state === "ACT") {
      if (property === "home" || property === "apartment") programs.push(supportProgram("ACT Home Energy Support", "Solar rebate up to $2,500", "Eligible concession-card homeowners can receive 50% of rooftop solar cost up to $2,500. Other home upgrades can lift total support to $5,000.", sourceLinks.actSupport, "Open now"));
      if (residential && batteryKwh >= 5) programs.push(supportProgram("ACT Sustainable Household Scheme", "3% loan up to $20,000", "Eligible households can use low-rate finance for approved batteries and other upgrades. Solar finance is limited to eligible Home Energy Support customers.", sourceLinks.act, "Open now"));
      if (grouped) programs.push(supportProgram("ACT Solar for Apartments", "Up to $100,000 support", "Eligible owners corporations can receive 50% as a grant and 50% as a zero-interest loan for shared solar. Batteries are not funded by this program.", sourceLinks.actApartments, "Open now"));
    }
    if (state === "SA") {
      if (residential) programs.push(supportProgram("Solar Sharer Offer", "3 free daytime hours", "Eligible households with a smart meter can choose an electricity offer with free power from 12 pm to 3 pm, up to 24 kWh a day. Supply and other usage charges still apply.", sourceLinks.solarSharer, "Available now"));
      if (residential && batteryKwh >= 5) programs.push(supportProgram("South Australia VPP", "No-cost system for eligible homes", "This government-backed offer is for eligible SA Housing Trust tenants. A solar and battery system is installed and maintained under the VPP offer.", sourceLinks.saVpp, "Targeted offer"));
      if (Number(postcode) >= 5000 && Number(postcode) <= 5006) programs.push(supportProgram("City of Adelaide incentives", "Solar and storage rebates", "Residents, businesses and community groups in the City of Adelaide may be able to claim local sustainability rebates. The amount depends on the project.", sourceLinks.saAdelaide, "Local program"));
    }
    if ((state === "NSW" || state === "SA" || (state === "QLD" && Number(postcode) <= 4308)) && residential && !programs.some((p) => p.title === "Solar Sharer Offer")) programs.push(supportProgram("Solar Sharer Offer", "3 free daytime hours", "Eligible households with a smart meter can choose an offer with up to 24 kWh of free power in the middle of each day. Other charges still apply.", sourceLinks.solarSharer, "Available now"));
    if (!programs.length) programs.push(supportProgram(`${stateSettings[state].name} support`, "Federal support only found", "No broad state or territory solar or battery rebate is open for this property type. Targeted or local programs may still apply.", `${sourceLinks.nationalFinder}?postcode=${postcode}`, "Check current offers"));
    return programs;
  }

  function monthlyPayment(principal, annualRate, months, monthlyFee = 0) {
    if (principal <= 0) return 0;
    if (!annualRate) return principal / months + monthlyFee;
    const rate = annualRate / 12;
    return principal * rate / (1 - Math.pow(1 + rate, -months)) + monthlyFee;
  }

  function financeRecommendation(property, state, totalCapital, batteryIncluded) {
    if (propertyDefaults[property].residential && !propertyDefaults[property].grouped) {
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
    if (step === 3) {
      const batteryOnly = selected("systemPlan") === "battery_only";
      const valid = !batteryOnly || (selected("existingSolar") === "yes" && Number($("#existingSize").value) > 0);
      $("#step3Error").textContent = valid ? "" : "Battery only needs the size of your current solar system.";
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
    const sizes = d.residential && !d.grouped
      ? [5, 6.5, 9.6, 10, 13.5, 15, 20, 27, 30, 40, 50]
      : [10, 15, 20, 30, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 750];
    const available = sizes.filter((size) => size <= d.batteryMax);
    return available.reduce((best, size) => Math.abs(size - raw) < Math.abs(best - raw) ? size : best, available[0]);
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
    const location = locationProfile(postcode);
    const state = location.state;
    const yieldPerDay = Number($("#solarYield").value) || location.yieldPerDay;
    const rise = (Number($("#priceRise").value) || 0) / 100;
    const dayShare = Number($("#dayUse").value) / 100;
    const fixedCost = supply * 365;
    const billUsage = Number($("#billUsageKwh").value) || 0;
    const billFactor = { monthly: 12, quarterly: 4, annual: 1 }[$("#billFrequency").value] || 1;
    const importedUsage = billUsage > 0 ? billUsage * billFactor : Math.max(1000, (bill - fixedCost) / tariff);
    const systemPlan = selected("systemPlan") || "compare";
    const goalFactor = goal === "independence" ? 1.10 : goal === "battery" ? 1.00 : .90;
    const existingSolar = selected("existingSolar");
    const existingSize = existingSolar === "yes" ? Number($("#existingSize").value) || 0 : 0;
    const batteryOnly = systemPlan === "battery_only";
    const existingGeneration = existingSize * yieldPerDay * 365;
    const usage = batteryOnly
      ? Math.max(importedUsage / Math.max(.2, 1 - dayShare), importedUsage + existingGeneration)
      : importedUsage;
    let solarKw = batteryOnly ? existingSize : nextSystemSize((usage * goalFactor) / (yieldPerDay * 365), property);
    solarKw = Math.max(solarKw, existingSize);
    const newSolarKw = batteryOnly ? 0 : Math.max(0, solarKw - existingSize);

    const generation = solarKw * yieldPerDay * 365;
    const daytimeLoad = usage * dayShare;
    const directSolar = Math.min(generation, daytimeLoad);
    const solarExport = Math.max(0, generation - directSolar);
    const solarImports = Math.max(0, usage - directSolar);
    const gridBill = batteryOnly ? Math.max(bill, usage * tariff + fixedCost) : bill;
    const solarRunningCost = batteryOnly ? bill : Math.max(0, solarImports * tariff + fixedCost - solarExport * feedIn);

    const eveningDaily = Math.max(0, usage - daytimeLoad) / 365;
    const surplusDaily = solarExport / 365;
    const rawBattery = Math.max(0, Math.min(eveningDaily / .9, surplusDaily * .95));
    const batteryKwh = roundBattery(rawBattery, property);
    const batteryChargeInput = Math.min(solarExport, batteryKwh * 365);
    const batteryDelivered = Math.min(solarImports, batteryChargeInput * .9);
    const batteryExports = Math.max(0, solarExport - batteryChargeInput);
    const batteryImports = Math.max(0, solarImports - batteryDelivered);
    const modelledBatteryCost = Math.max(0, batteryImports * tariff + fixedCost - batteryExports * feedIn);
    const batteryRunningCost = batteryOnly ? Math.max(fixedCost, solarRunningCost - batteryDelivered * Math.max(0, tariff - feedIn)) : modelledBatteryCost;

    const solarStc = solarStcEstimate(newSolarKw, location.zoneRating);
    const batteryStc = batteryStcEstimate(batteryKwh);
    const grossSolarCapital = newSolarKw > 0 ? d.solarBase + newSolarKw * d.solarPerKw : 0;
    const grossBatteryCapital = d.batteryBase + batteryKwh * d.batteryPerKwh;
    const solarCapital = Math.max(0, grossSolarCapital - solarStc.value);
    const batteryCapital = Math.max(0, grossBatteryCapital - batteryStc.value);
    const totalCapital = solarCapital + batteryCapital;
    const solarSaving = Math.max(0, gridBill - solarRunningCost);
    const batterySaving = Math.max(0, gridBill - batteryRunningCost);
    const incrementalBatterySaving = Math.max(0, solarRunningCost - batteryRunningCost);
    const solarPayback = solarSaving ? solarCapital / solarSaving : Infinity;
    const batteryPayback = batterySaving ? totalCapital / batterySaving : Infinity;
    const degradation = .005;

    const grid10 = cumulativeCost(gridBill, 10, rise);
    const grid25 = cumulativeCost(gridBill, 25, rise);
    const solar10 = cumulativeCost({ grid: gridBill }, 10, rise, degradation, solarSaving, solarCapital);
    const solar25 = cumulativeCost({ grid: gridBill }, 25, rise, degradation, solarSaving, solarCapital);
    const battery10 = cumulativeCost({ grid: gridBill }, 10, rise, degradation, batterySaving, totalCapital);
    const battery25 = cumulativeCost({ grid: gridBill }, 25, rise, degradation, batterySaving, totalCapital);
    const primarySaving = systemPlan === "solar" ? solarSaving : batteryOnly ? incrementalBatterySaving : batterySaving;
    const primaryCapital = systemPlan === "solar" ? solarCapital : batteryOnly ? batteryCapital : totalCapital;
    const primaryPayback = primarySaving ? primaryCapital / primarySaving : Infinity;
    const primaryBenefit10 = cumulativeBenefit(primarySaving, 10, rise, degradation, primaryCapital);
    const primaryBenefit25 = cumulativeBenefit(primarySaving, 25, rise, degradation, primaryCapital);

    results = {
      date: new Date().toLocaleDateString("en-AU"), property, propertyLabel: d.label, goal, goalLabel: goalLabels[goal], postcode, state, stateName: stateSettings[state].name, solarZone: location.zone, zoneRating: location.zoneRating,
      bill, gridBill, tariff, feedIn, supply, yieldPerDay, rise, dayShare, usage, solarKw, newSolarKw, existingSolar, existingSize, systemPlan, batteryOnly, generation, directSolar, solarExport, solarImports,
      batteryKwh, batteryChargeInput, batteryDelivered, batteryExports, batteryImports, eveningDaily, surplusDaily, solarRunningCost, batteryRunningCost,
      solarCapital, batteryCapital, totalCapital, grossSolarCapital, grossBatteryCapital, solarStc, batteryStc, modelledIncentives: solarStc.value + (systemPlan === "solar" ? 0 : batteryStc.value),
      investmentLow: primaryCapital * .9, investmentHigh: primaryCapital * 1.15,
      solarSaving, batterySaving, incrementalBatterySaving, solarPayback, batteryPayback, primarySaving, primaryCapital, primaryPayback, primaryBenefit10, primaryBenefit25, grid10, grid25, solar10, solar25, battery10, battery25,
      solarBenefit10: cumulativeBenefit(solarSaving, 10, rise, degradation, solarCapital), solarBenefit25: cumulativeBenefit(solarSaving, 25, rise, degradation, solarCapital),
      batteryBenefit10: cumulativeBenefit(batterySaving, 10, rise, degradation, totalCapital), batteryBenefit25: cumulativeBenefit(batterySaving, 25, rise, degradation, totalCapital),
      batteryPreference: selected("battery"), programs: statePrograms(state, property, systemPlan === "solar" ? 0 : batteryKwh, postcode, solarKw), batterySizingConstraint: rawBattery < 5 ? "small" : rawBattery > d.batteryMax ? "cap" : "",
      supportChecked: "6 August 2026"
    };
    results.finance = financeRecommendation(property, state, primaryCapital, systemPlan !== "solar");
    window.solarAssessmentResults = results;
    renderResults();
    showStep(4);
  }

  function formatPayback(value) {
    return Number.isFinite(value) && value < 40 ? `${value.toFixed(1)} years` : "Review required";
  }

  function renderResults() {
    const r = results;
    const primaryLabel = r.systemPlan === "solar" ? "Solar only" : r.batteryOnly ? "Battery added to current solar" : "Solar + battery";
    $("#recommendedSystem").textContent = r.batteryOnly ? `Add a battery to ${r.solarKw} kW solar` : `${r.solarKw} kW solar system`;
    $("#recommendedBattery").textContent = r.systemPlan === "solar" ? "Not included" : `${r.batteryKwh} kWh`;
    $("#batteryRecommendationLabel").textContent = r.systemPlan === "solar" ? "Battery option" : "Battery size";
    $("#batterySizingNote").textContent = r.systemPlan === "solar" ? "Solar-only result selected" : r.batterySizingConstraint === "small" ? "The smallest planning size is shown. Check interval data before buying." : r.batterySizingConstraint === "cap" ? `Limited to ${r.batteryKwh} kWh for this first estimate. Your daily load may support a custom size.` : `Sized from about ${number(r.surplusDaily)} kWh of extra solar and ${number(r.eveningDaily)} kWh of evening use each day.`;
    $("#recommendationReason").textContent = r.batteryOnly
      ? `The battery is sized from your ${r.existingSize} kW solar system, extra solar and evening use.`
      : `This starting size uses about ${number(r.usage)} kWh a year and focuses on ${r.goalLabel}.`;
    $("#flowSolar").textContent = r.batteryOnly ? `${r.solarKw} kW current solar` : `${r.solarKw} kW proposed solar`;
    $("#flowBattery").textContent = r.systemPlan === "solar" ? "Optional later" : `${r.batteryKwh} kWh stores extra solar`;
    $("#annualSavings").textContent = money(r.primarySaving);
    $("#paybackPeriod").textContent = formatPayback(r.primaryPayback);
    $("#tenYearBenefit").textContent = money(r.primaryBenefit10);
    $("#twentyFiveYearBenefit").textContent = money(r.primaryBenefit25);
    $("#primaryScenarioLabel").textContent = primaryLabel;
    $("#paybackScenarioLabel").textContent = primaryLabel;
    $("#gridAnnual").textContent = money(r.gridBill); $("#gridImports").textContent = `${number(r.usage)} kWh`;
    $("#solarAnnual").textContent = money(r.solarRunningCost); $("#solarAnnualSaving").textContent = money(r.solarSaving); $("#solarBenefit10").textContent = money(r.solarBenefit10); $("#solarBenefit25").textContent = money(r.solarBenefit25); $("#solarImports").textContent = `${number(r.solarImports)} kWh`;
    $("#batteryAnnual").textContent = money(r.batteryRunningCost); $("#batteryAnnualSaving").textContent = money(r.batterySaving); $("#batteryBenefit10").textContent = money(r.batteryBenefit10); $("#batteryBenefit25").textContent = money(r.batteryBenefit25); $("#batteryImports").textContent = `${number(r.batteryImports)} kWh`;
    $("#solarScenarioName").textContent = r.batteryOnly ? "Current solar" : "Solar only";
    $("#solarVisualLabel").textContent = r.batteryOnly ? "Current solar" : "Solar only";
    $("#batteryVisualLabel").textContent = r.batteryOnly ? "Current solar + battery" : "Solar + battery";
    $("#solarScenarioRow").classList.toggle("recommended-row", r.systemPlan === "solar");
    $("#batteryScenarioRow").classList.toggle("recommended-row", r.systemPlan !== "solar");
    $("#solarRecommendationBadge").classList.toggle("hidden", r.systemPlan !== "solar");
    $("#batteryRecommendationBadge").classList.toggle("hidden", r.systemPlan === "solar");
    $("#batteryScenarioName").textContent = r.batteryOnly ? "Current solar + battery" : "Solar + battery";
    const solarRate = clamp(r.solarSaving / r.gridBill * 100, 0, 100);
    const batteryRate = clamp(r.batterySaving / r.gridBill * 100, 0, 100);
    $("#gridVisualCost").textContent = money(r.gridBill);
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
    $("#netSystemCost").textContent = money(r.primaryCapital);
    $("#investmentRange").textContent = `${money(r.investmentLow)}–${money(r.investmentHigh)} indicative installed range`;
    const solarNote = r.solarStc.eligible ? `${r.solarStc.certificates} estimated STCs using a 2026 five-year deeming period and a $${STC_VALUE.toFixed(2)} certificate planning value.` : r.newSolarKw <= 0 ? "No new solar is priced in this result, so no new solar STCs are deducted." : "Systems of 100 kW or more are not eligible for solar STCs. Large-scale certificates may apply after a project review.";
    const cards = [
      incentiveCard("Federal solar STCs", money(r.solarStc.value), solarNote, sourceLinks.federal, true),
      incentiveCard("Federal battery STCs", r.systemPlan === "solar" ? "Not included" : money(r.batteryStc.value), r.systemPlan === "solar" ? "Available for an eligible battery if one is added later." : `${r.batteryStc.certificates} estimated STCs using the May–December 2026 capacity taper.`, sourceLinks.battery, r.systemPlan !== "solar"),
      incentiveCard("Household Energy Upgrades Fund", "Discounted green loans", "Eligible households, rental owners and strata may access lower-cost finance through participating lenders. This is not deducted from the price.", sourceLinks.heuf, false),
      ...r.programs.map((program) => incentiveCard(program.title, program.value, program.note, program.link, false))
    ];
    $("#incentiveGrid").innerHTML = cards.join("");
  }

  function renderFinance() {
    const r = results;
    const f = r.finance;
    const monthlySaving = r.primarySaving / 12;
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
    const grid = "#c53d4a", solar = "#f39a2d", battery = "#178a5b";
    const scenarioLabels = ["Grid only", results.batteryOnly ? "Current solar" : "Solar only", results.batteryOnly ? "Current solar + battery" : "Solar + battery"];
    charts.billSavings = new Chart($("#billSavingsChart"), { type: "bar", data: { labels: scenarioLabels, datasets: [{ label: "Estimated saving", data: [0, results.solarSaving, results.batterySaving], backgroundColor: ["rgba(197,61,74,.18)", "rgba(243,154,45,.25)", "rgba(23,138,91,.25)"], borderRadius: 7, barThickness: 30 }, { label: "Remaining energy cost", data: [results.gridBill, results.solarRunningCost, results.batteryRunningCost], backgroundColor: [grid, solar, battery], borderRadius: 7, barThickness: 30 }] }, options: { ...common, indexAxis: "y", scales: { x: { stacked: true, beginAtZero: true, max: Math.ceil(results.gridBill / 500) * 500, ticks: { callback: (v) => `$${number(v)}` } }, y: { stacked: true, grid: { display: false } } }, plugins: { ...common.plugins, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${money(ctx.raw)}` } } } } });
    charts.cost = new Chart($("#costChart"), { type: "bar", data: { labels: scenarioLabels, datasets: [{ label: "Year 1 cost", data: [results.gridBill, results.solarRunningCost, results.batteryRunningCost], backgroundColor: [grid, solar, battery], borderRadius: 6, maxBarThickness: 42 }] }, options: { ...common, scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${number(v)}` } }, x: { grid: { display: false } } }, plugins: { ...common.plugins, legend: { display: false } } } });

    const years = Array.from({ length: 25 }, (_, i) => i + 1);
    const solarBenefits = years.map((year) => cumulativeBenefit(results.solarSaving, year, results.rise, .005, results.solarCapital));
    const batteryBenefits = years.map((year) => cumulativeBenefit(results.batterySaving, year, results.rise, .005, results.totalCapital));
    charts.savings = new Chart($("#savingsChart"), { type: "line", data: { labels: years, datasets: [{ label: scenarioLabels[1], data: solarBenefits, borderColor: solar, backgroundColor: "rgba(243,154,45,.08)", tension: .3, pointRadius: 0, borderWidth: 2 }, { label: scenarioLabels[2], data: batteryBenefits, borderColor: battery, backgroundColor: "rgba(23,138,91,.08)", tension: .3, pointRadius: 0, borderWidth: 2 }] }, options: { ...common, scales: { y: { ticks: { callback: (v) => `$${number(v)}` } }, x: { grid: { display: false }, title: { display: true, text: "Year", font: { size: 9 } } } } } });

    charts.energy = new Chart($("#energyChart"), { type: "bar", data: { labels: scenarioLabels, datasets: [{ label: "Direct solar", data: [0, results.directSolar, results.directSolar], backgroundColor: solar, stack: "energy", yAxisID: "energy" }, { label: "Battery", data: [0, 0, results.batteryDelivered], backgroundColor: battery, stack: "energy", yAxisID: "energy" }, { label: "Grid", data: [results.usage, results.solarImports, results.batteryImports], backgroundColor: grid, stack: "energy", yAxisID: "energy" }] }, options: { ...common, indexAxis: "y", scales: { x: { stacked: true, ticks: { callback: (v) => `${number(v)} kWh` } }, y: { stacked: true, grid: { display: false } } } } });

    const hours = ["12am", "3am", "6am", "9am", "12pm", "3pm", "6pm", "9pm", "12am"];
    const solarProfile = [0, 0, 0.05, .45, 1, .72, .12, 0, 0].map((v) => v * results.solarKw);
    const batteryProfile = [.28, .2, .08, 0, -.35, -.55, .32, .62, .28].map((v) => v * Math.min(results.batteryKwh / 4, results.solarKw));
    charts.battery = new Chart($("#batteryChart"), { type: "line", data: { labels: hours, datasets: [{ label: "Solar output", data: solarProfile, borderColor: solar, backgroundColor: "rgba(243,154,45,.1)", fill: true, tension: .35, pointRadius: 0 }, { label: "Battery charge / discharge", data: batteryProfile, borderColor: battery, backgroundColor: "rgba(23,138,91,.08)", fill: true, tension: .35, pointRadius: 0 }] }, options: { ...common, scales: { y: { ticks: { callback: (v) => `${v.toFixed(0)} kW` } }, x: { grid: { display: false } } } } });
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
      systemPlan: results.systemPlan, batteryRecommendationKwh: results.batteryKwh, estimatedAnnualSavings: Math.round(results.primarySaving), estimatedPaybackYears: Number.isFinite(results.primaryPayback) ? Number(results.primaryPayback.toFixed(1)) : "Review required",
      state: results.state, solarZone: results.solarZone, estimatedFederalIncentives: Math.round(results.modelledIncentives), estimatedSystemInvestment: Math.round(results.primaryCapital), possibleStateProgram: results.programs.map((program) => program.title).join("; "),
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
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        canvas.getContext("2d").drawImage(image, 0, 0);
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
    const photo = await imageData("mark-photo.png");
    const primaryLabel = results.systemPlan === "solar" ? "Solar only" : results.batteryOnly ? "Battery added to current solar" : "Solar + battery";
    const recommendation = results.batteryOnly ? `${results.batteryKwh} kWh battery for ${results.solarKw} kW solar` : results.systemPlan === "solar" ? `${results.solarKw} kW solar` : `${results.solarKw} kW solar + ${results.batteryKwh} kWh battery`;

    doc.setFillColor(6, 47, 63); doc.rect(0, 0, 210, 297, "F");
    doc.setFillColor(200, 239, 110); doc.circle(181, 28, 22, "F");
    doc.setFillColor(255, 181, 61); doc.circle(181, 28, 9, "F");
    doc.setTextColor(200, 239, 110); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("PERSONALISED ENERGY ASSESSMENT", 18, 38);
    doc.setTextColor(255, 255, 255); doc.setFontSize(31); doc.text(["Your solar", "savings report."], 18, 65, { lineHeightFactor: 1.05 });
    doc.setTextColor(183, 205, 210); doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.text(`Prepared for ${lead.name}`, 18, 96); doc.setFontSize(9); doc.text(`${results.propertyLabel} · ${results.postcode} · ${results.date}`, 18, 104);
    doc.setFillColor(10, 64, 81); doc.roundedRect(18, 126, 174, 58, 5, 5, "F");
    doc.setTextColor(169, 195, 200); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("RECOMMENDED STARTING POINT", 28, 141);
    doc.setTextColor(200, 239, 110); doc.setFontSize(19); doc.text(recommendation, 28, 156, { maxWidth: 150 });
    doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.text(`${primaryLabel} planning result`, 28, 169);
    if (photo) { doc.setFillColor(236, 240, 238); doc.roundedRect(145, 213, 47, 59, 4, 4, "F"); doc.addImage(photo, "PNG", 147, 215, 43, 55, undefined, "FAST"); }
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text("Mark Fitzpatrick", 18, 232); doc.setTextColor(183, 205, 210); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text("Renewable Energy Specialist", 18, 241); doc.text(CONTACT_PHONE, 18, 252); doc.text(CONTACT_EMAIL, 18, 260);

    doc.addPage(); pdfHeader(doc, "Your opportunity at a glance", 2);
    doc.setFillColor(6, 47, 63); doc.roundedRect(16, 47, 178, 37, 4, 4, "F"); doc.setTextColor(169, 195, 200); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("SYSTEM RECOMMENDATION", 23, 58); doc.setTextColor(200, 239, 110); doc.setFontSize(17); doc.text(recommendation, 23, 71, { maxWidth: 164 }); doc.setTextColor(214, 227, 229); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text(`Starting point for a ${results.propertyLabel.toLowerCase()} focused on ${results.goalLabel}.`, 23, 78);
    pdfCard(doc, 16, 92, 42, "Annual savings", money(results.primarySaving), primaryLabel); pdfCard(doc, 62, 92, 42, "Payback", formatPayback(results.primaryPayback), "Planning estimate"); pdfCard(doc, 108, 92, 42, "10-year benefit", money(results.primaryBenefit10), "Net of system cost"); pdfCard(doc, 154, 92, 40, "25-year benefit", money(results.primaryBenefit25), "Net of system cost");
    doc.setTextColor(16, 37, 45); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Scenario comparison", 16, 138);
    const rows = [
      ["Grid only", money(results.gridBill), "—", "—", "—"],
      [results.batteryOnly ? "Current solar" : "Solar only", money(results.solarRunningCost), money(results.solarSaving), money(results.solarBenefit10), money(results.solarBenefit25)],
      [results.batteryOnly ? "Current solar + battery" : "Solar + battery", money(results.batteryRunningCost), money(results.batterySaving), money(results.batteryBenefit10), money(results.batteryBenefit25)]
    ];
    const cols = ["Scenario", "Year 1", "Annual saving", "10y net benefit", "25y net benefit"];
    let y = 147; doc.setFillColor(239, 244, 243); doc.rect(16, y, 178, 10, "F"); doc.setFontSize(7); doc.setTextColor(100,117,123); cols.forEach((c, i) => doc.text(c, [20,79,111,149,190][i], y + 6, i ? { align: "right" } : undefined)); y += 10;
    rows.forEach((row, ri) => { if (ri === 2) { doc.setFillColor(240, 248, 244); doc.rect(16, y, 178, 13, "F"); } doc.setTextColor(16,37,45); doc.setFont("helvetica", ri === 2 ? "bold" : "normal"); row.forEach((c, i) => doc.text(c, [20,79,111,149,190][i], y + 8, i ? { align: "right" } : undefined)); doc.setDrawColor(223,231,231); doc.line(16, y + 13, 194, y + 13); y += 13; });
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Key energy estimates", 16, 212);
    const estimates = [`Annual electricity use: ${number(results.usage)} kWh`, `Solar generation: ${number(results.generation)} kWh/year`, `Solar used directly: ${number(results.directSolar)} kWh/year`, `Solar delivered from battery: ${number(results.batteryDelivered)} kWh/year`, `Official solar zone: ${results.solarZone} for postcode ${results.postcode}`, `Estimated investment for this result: ${money(results.primaryCapital)}`];
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

    doc.addPage(); pdfHeader(doc, "Government support for your postcode", 5);
    doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(`Programs matched to postcode ${results.postcode} in ${results.stateName}. Checked ${results.supportChecked}. Eligibility must be confirmed before purchase.`, 16, 49, { maxWidth: 178 });
    const allSupport = [
      { title: "Federal solar STCs", value: money(results.solarStc.value), note: results.solarStc.eligible ? `${results.solarStc.certificates} certificates modelled for new solar.` : "No solar STCs modelled for this result." },
      { title: "Federal battery STCs", value: money(results.batteryStc.value), note: `${results.batteryStc.certificates} certificates modelled with the 2026 taper.` },
      { title: "Household Energy Upgrades Fund", value: "Discounted loans", note: "Finance may be available through participating lenders. Not deducted." },
      ...results.programs
    ].slice(0, 8);
    allSupport.forEach((program, index) => {
      const x = index % 2 ? 107 : 16; const cardY = 61 + Math.floor(index / 2) * 51;
      doc.setFillColor(index < 2 ? 240 : 245, index < 2 ? 248 : 247, index < 2 ? 244 : 242); doc.roundedRect(x, cardY, 87, 44, 3, 3, "F");
      doc.setTextColor(16,37,45); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.text(doc.splitTextToSize(program.title, 77), x + 5, cardY + 8);
      doc.setTextColor(index === 1 ? 23 : 243, index === 1 ? 138 : 154, index === 1 ? 91 : 45); doc.setFontSize(11); doc.text(String(program.value), x + 5, cardY + 20, { maxWidth: 77 });
      doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(6.6); doc.text(doc.splitTextToSize(program.note, 77).slice(0, 3), x + 5, cardY + 27, { lineHeightFactor: 1.25 });
    });
    doc.setFillColor(245,242,233); doc.roundedRect(16, 266, 178, 11, 3, 3, "F"); doc.setTextColor(71,93,99); doc.setFontSize(7); doc.text("Local and short-term offers can change. Check energy.gov.au/rebates before you buy.", 22, 273);

    doc.addPage(); pdfHeader(doc, "Assumptions and important notes", 6);
    doc.setTextColor(16,37,45); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Calculator assumptions", 16, 51);
    const assumptions = [`Electricity tariff: $${results.tariff.toFixed(3)}/kWh`, `Feed-in tariff: $${results.feedIn.toFixed(3)}/kWh`, `Daily supply charge: $${results.supply.toFixed(2)}`, `Solar zone ${results.solarZone}: ${results.yieldPerDay.toFixed(2)} kWh/kW/day`, `Electricity price rise: ${(results.rise * 100).toFixed(1)}% per year`, `Solar output reduction: 0.5% per year`, `Battery round-trip efficiency: about 90%`, `STC planning value: $${STC_VALUE.toFixed(2)} per certificate`];
    doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(assumptions.map((item) => `• ${item}`), 20, 64, { lineHeightFactor: 1.7 });
    doc.setFillColor(240,248,244); doc.roundedRect(16, 122, 178, 50, 4, 4, "F"); doc.setTextColor(23,138,91); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Possible finance", 23, 136); doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(doc.splitTextToSize(`${results.finance.brand}: about ${money(results.finance.monthly)}/month (${results.finance.term}). ${results.finance.note} Eligibility and final terms apply.`, 162), 23, 147, { lineHeightFactor: 1.4 });
    doc.setFillColor(245,242,233); doc.roundedRect(16, 182, 178, 54, 4, 4, "F"); doc.setTextColor(16,37,45); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Important", 23, 196); doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(8); const disclaimer = "This report is a first planning estimate. It is not financial advice, an engineering design, a savings guarantee or a formal quote. Results depend on interval data, roof space, shade, weather, network approval, tariffs, equipment and final price. Government programs and certificate values can change. Confirm eligibility before buying."; doc.text(doc.splitTextToSize(disclaimer, 162), 23, 207, { lineHeightFactor: 1.4 });
    if (lead.appointmentRequested === "Yes") { doc.setFillColor(240,248,244); doc.roundedRect(16, 245, 178, 30, 4, 4, "F"); doc.setTextColor(23,138,91); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("Telephone appointment requested", 23, 257); doc.setTextColor(71,93,99); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text(`${new Date(`${lead.appointmentDate}T12:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} at ${lead.appointmentTime}${lead.billUploaded === "Yes" ? " · energy bill uploaded" : ""}`, 23, 267); }

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
    $$("input[name='systemPlan']").forEach((input) => input.addEventListener("change", () => {
      if (input.value !== "battery_only" || !input.checked) return;
      const yes = $("input[name='existingSolar'][value='yes']");
      yes.checked = true;
      $("#existingSizeWrap").classList.remove("hidden");
      $("input[name='battery'][value='yes']").checked = true;
    }));
    $("#calculateButton").addEventListener("click", () => {
      const valid1 = validateStep(1), valid2 = validateStep(2), valid3 = validateStep(3);
      if (valid1 && valid2 && valid3) calculate();
      else showStep(!valid1 ? 1 : !valid2 ? 2 : 3);
    });
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
