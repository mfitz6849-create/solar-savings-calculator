/*
==================================================
Solar Savings Assessment
Calculation Engine

Prepared by:
Mark Fitzpatrick
Renewable Energy Specialist

==================================================
*/


let selectedProperty = "Residential";





function selectProperty(type){


selectedProperty = type;


document.getElementById(
"propertyType"
).value = type;


console.log(
"Property selected:",
type
);


}








function calculateSolar(){



const billValue =

Number(
document.getElementById(
"energyBill"
).value
);



const billingPeriod =

document.getElementById(
"billingPeriod"
).value;



const postcode =

document.getElementById(
"postcode"
)?.value || "";



const ownership =

document.getElementById(
"ownership"
)?.value || "";







if(!billValue){


alert(
"Please select your approximate electricity bill."
);


return;


}








/*
----------------------------------
Convert to annual bill
----------------------------------
*/


let annualBill;



if(
billingPeriod === "quarterly"
){


annualBill =
billValue * 4;


}

else{


annualBill =
billValue * 12;


}








/*
----------------------------------
Energy usage adjustments
----------------------------------
*/


let usageFactor = 1;





if(
document.getElementById("aircon").checked
){

usageFactor +=0.10;

}



if(
document.getElementById("ev").checked
){

usageFactor +=0.15;

}



if(
document.getElementById("pool").checked
){

usageFactor +=0.10;

}



if(
document.getElementById("pump").checked
){

usageFactor +=0.20;

}



if(
document.getElementById("machinery").checked
){

usageFactor +=0.25;

}






annualBill =
annualBill * usageFactor;









/*
----------------------------------
Recommend solar size
----------------------------------
*/


let solarSize;



if(
annualBill <= 3500
){

solarSize = 6;


}

else if(
annualBill <=7000
){

solarSize = 10;


}

else if(
annualBill <=12000
){

solarSize = 15;


}

else if(
annualBill <=20000
){

solarSize = 25;


}

else{


solarSize = 40;


}







/*
----------------------------------
Property adjustments
----------------------------------
*/


if(
selectedProperty === "Business"
){

solarSize *=1.25;

}



if(
selectedProperty === "Commercial"
){

solarSize *=1.5;

}



if(
selectedProperty === "Farming"
){

solarSize *=1.75;

}






solarSize =

Math.round(
solarSize
);









/*
----------------------------------
Battery recommendation
----------------------------------
*/


const batteryPreference =

document.getElementById(
"batteryPreference"
).value;



let battery;



if(
batteryPreference === "none"
){


/*
Automatic recommendation
*/


if(
annualBill > 12000
){

battery =
"20kWh Battery Recommended";

}

else if(
annualBill >7000
){

battery =
"13.5kWh Battery Recommended";

}

else{


battery =
"Battery Optional";

}


}

else if(
batteryPreference === "small"
){


battery =
"10kWh Battery";


}

else if(
batteryPreference === "medium"
){


battery =
"20kWh Battery";


}

else{


battery =
"30kWh+ Battery";


}









/*
----------------------------------
Savings calculation
----------------------------------
*/


const generation =

solarSize *

SOLAR_CONFIG.solarProductionPerKW;





const selfUsedEnergy =

generation *

SOLAR_CONFIG.selfConsumptionTarget;





let annualSavings =

selfUsedEnergy *

SOLAR_CONFIG.electricityRate;





// limit savings

annualSavings =

Math.round(
annualSavings
);










/*
----------------------------------
Estimate payback
----------------------------------
*/


let systemCost =

solarSize * 900;



if(
battery.includes("Battery")
){

systemCost +=15000;


}




const payback =

Math.round(

(
systemCost /

annualSavings

)

*10

)

/10;









/*
----------------------------------
Save results
----------------------------------
*/


window.assessmentResults = {



property:selectedProperty,


postcode:postcode,


ownership:ownership,


annualBill:

Math.round(
annualBill
),



solarSize:

solarSize +
"kW Solar System",



battery:battery,



estimatedSavings:

annualSavings,



payback:payback



};








console.log(
window.assessmentResults
);







displayResults();







if(
typeof createCharts === "function"
){

createCharts();

}




}









function displayResults(){



const result =

window.assessmentResults;





document
.getElementById(
"resultsSection"
)
.classList
.remove(
"hidden"
);





document
.getElementById(
"chartsSection"
)
.classList
.remove(
"hidden"
);








document
.getElementById(
"solarResult"
)
.innerHTML =

result.solarSize;







document
.getElementById(
"batteryResult"
)
.innerHTML =

result.battery;








document
.getElementById(
"savingsResult"
)
.innerHTML =

"$" +

result.estimatedSavings
.toLocaleString()

+

" / year";







document
.getElementById(
"paybackResult"
)
.innerHTML =

result.payback +

" years";



}
