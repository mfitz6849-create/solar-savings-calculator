/*
==================================================
Solar Savings Assessment Calculator

Prepared by:
Mark Fitzpatrick
Renewable Energy Specialist

Version:
Lead Generation Estimator

Includes:
Residential
Business
Commercial
Farming

Inputs:
- Property type
- Electricity bill
- Energy profile
- Battery interest

==================================================
*/


let selectedProperty = "";

let batteryPreference = "";

let energyProfile = [];

let assessmentResults = {};








function selectProperty(type){

selectedProperty = type;

document.getElementById(
"propertyType"
)
?.setAttribute(
"value",
type
);

}








function selectBattery(option){

batteryPreference = option;

}









function nextStep(step){



document
.querySelectorAll(".step")
.forEach(function(section){


section.classList.add(
"hidden"
);


});




const current =

document.getElementById(
"step"+step
);



if(current){

current.classList.remove(
"hidden"
);


updateProgress(step);

}



}








function updateProgress(step){


const bar =

document.getElementById(
"progressBar"
);



if(bar){


bar.style.width =

(
(step / 7)
*
100

)

+

"%";


}


}









function calculateSolar(){



const bill =

Number(

document.getElementById(
"billAmount"
).value

);



if(!selectedProperty){

alert(
"Please select your property type."
);

return;

}





if(!bill){

alert(
"Please select your electricity bill."
);

return;

}









const annualBill =

bill *
12;






let solarSize;

let battery;

let savingsPercent;

let notes;









// =============================
// RESIDENTIAL
// =============================


if(selectedProperty==="Residential"){



if(bill <=150){


solarSize="4kW Solar System";

battery="Optional 5-10kWh Battery";

savingsPercent=.55;

}



else if(bill<=300){


solarSize="6.6kW Solar System";

battery="10kWh Battery Recommended";

savingsPercent=.65;

}



else if(bill<=600){


solarSize="10kW Solar System";

battery="13.5kWh Battery Recommended";

savingsPercent=.72;

}



else{


solarSize="13.2kW+ Solar System";

battery="20kWh+ Battery Recommended";

savingsPercent=.78;

}



notes =
"Designed to reduce household electricity costs and increase energy independence.";


}









// =============================
// BUSINESS
// =============================


if(selectedProperty==="Business"){



if(bill<=600){


solarSize="10kW Solar System";

battery="Optional Battery Storage";

savingsPercent=.55;


}

else if(bill<=1500){


solarSize="25kW Solar System";

battery="30kWh Battery";

savingsPercent=.65;


}

else{


solarSize="50kW+ Solar System";

battery="50-100kWh Battery";

savingsPercent=.70;


}


notes =
"Business systems are designed to maximise daytime solar usage and reduce operating costs.";

}









// =============================
// COMMERCIAL
// =============================


if(selectedProperty==="Commercial"){



if(bill<=2000){


solarSize="40kW Solar System";

battery="50kWh Battery";

savingsPercent=.60;


}


else if(bill<=5000){


solarSize="75kW Solar System";

battery="100kWh Battery";

savingsPercent=.65;


}


else{


solarSize="100kW+ Commercial System";

battery="Large Scale Battery Storage";

savingsPercent=.70;


}



notes =
"Commercial assessments focus on energy optimisation and long-term cost reduction.";

}









// =============================
// FARMING
// =============================


if(selectedProperty==="Farming"){



if(bill<=1000){


solarSize="20kW Solar System";

battery="20-30kWh Battery";

savingsPercent=.60;


}

else if(bill<=2500){


solarSize="40kW Solar System";

battery="50kWh Battery";

savingsPercent=.70;


}

else{


solarSize="75kW+ Solar System";

battery="Large Battery Solution";

savingsPercent=.75;


}


notes =
"Farm systems consider pumps, sheds, irrigation and agricultural loads.";

}










// Battery adjustment


if(
batteryPreference==="No"
){


battery =
"Solar Only - Battery Not Included";


}








// Estimate savings


const estimatedSavings =

annualBill *
savingsPercent;






const systemCost =

estimateSystemCost(
solarSize,
battery
);






const payback =

systemCost /
estimatedSavings;









assessmentResults = {


property:

selectedProperty,


annualBill,


solarSize,


battery,


estimatedSavings,


systemCost,


payback:

payback.toFixed(1),


notes,


batteryPreference,


energyProfile



};







window.assessmentResults =

assessmentResults;







displayResults();



}









function estimateSystemCost(
solar,
battery
){


let cost=0;



if(
solar.includes("4")
)
cost+=6000;


else if(
solar.includes("6.6")
)
cost+=9000;


else if(
solar.includes("10")
)
cost+=14000;


else if(
solar.includes("13")
)
cost+=18000;


else if(
solar.includes("20")
)
cost+=26000;


else if(
solar.includes("40")
)
cost+=45000;


else if(
solar.includes("75")
)
cost+=85000;


else
cost+=120000;





if(
battery.includes("10")
)
cost+=13000;


if(
battery.includes("13")
)
cost+=17000;


if(
battery.includes("20")
)
cost+=25000;


if(
battery.includes("50")
)
cost+=55000;



return cost;


}









function displayResults(){


document.getElementById(
"resultProperty"
).innerHTML =

assessmentResults.property;




document.getElementById(
"solarRecommendation"
).innerHTML =

assessmentResults.solarSize;




document.getElementById(
"batteryRecommendation"
).innerHTML =

assessmentResults.battery;




document.getElementById(
"estimatedSavings"
).innerHTML =

formatCurrency(
assessmentResults.estimatedSavings
);



}





function formatCurrency(value){


return new Intl.NumberFormat(
"en-AU",
{

style:"currency",

currency:"AUD",

maximumFractionDigits:0

}

)
.format(value);


}