/*
==================================================
Solar Savings Assessment
Calculator Engine

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



const bill =

Number(
document.getElementById(
"energyBill"
).value
);



const period =

document.getElementById(
"billingPeriod"
).value;




if(!bill){


alert(
"Please select your approximate electricity bill."
);


return;


}






let annualBill;



if(period === "quarterly"){


annualBill = bill * 4;


}

else{


annualBill = bill * 12;


}







/*
----------------------------------
Energy usage factors
----------------------------------
*/


let usageMultiplier = 1;



if(
document.getElementById(
"aircon"
).checked
){

usageMultiplier +=0.1;

}



if(
document.getElementById(
"ev"
).checked
){

usageMultiplier +=0.15;

}



if(
document.getElementById(
"pool"
).checked
){

usageMultiplier +=0.1;

}



if(
document.getElementById(
"pump"
).checked
){

usageMultiplier +=0.2;

}



if(
document.getElementById(
"machinery"
).checked
){

usageMultiplier +=0.25;

}





annualBill =
annualBill *
usageMultiplier;








/*
----------------------------------
Solar size calculation
----------------------------------
*/


let solarSize;



if(annualBill < 4000){


solarSize = 6;


}

else if(annualBill < 7000){


solarSize = 10;


}

else if(annualBill < 12000){


solarSize = 15;


}

else if(annualBill < 20000){


solarSize = 25;


}

else{


solarSize = 50;


}








/*
----------------------------------
Property adjustment
----------------------------------
*/


if(
selectedProperty === "Commercial"
){

solarSize *=1.5;


}



if(
selectedProperty === "Farming"
){

solarSize *=1.5;


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


const batteryChoice =

document.getElementById(
"batteryPreference"
).value;



let battery;



if(
batteryChoice === "none"
){


battery =
"No Battery";


}

else if(
batteryChoice === "small"
){


battery =
"10kWh Battery";


}

else if(
batteryChoice === "medium"
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


const solarGeneration =

solarSize *
SOLAR_CONFIG.solarProductionPerKW;





const usableSolar =

solarGeneration *
SOLAR_CONFIG.selfConsumptionTarget;





const savings =

usableSolar *
SOLAR_CONFIG.electricityRate;







const payback =

Math.round(

(
solarSize * 1000
+
(
battery.includes("Battery")
?
12000
:
0
)
)

/

savings

*10

)

/

10;








/*
----------------------------------
Store assessment
----------------------------------
*/


window.assessmentResults = {


property:selectedProperty,


annualBill:

Math.round(
annualBill
),


solarSize:

solarSize +
"kW Solar System",


battery:battery,


estimatedSavings:

Math.round(
savings
),


payback:payback


};








displayResults();


if(
typeof createCharts === "function"
){

createCharts();

}







}









function displayResults(){


const data =
window.assessmentResults;



document.getElementById(
"resultsSection"
)
.classList.remove(
"hidden"
);



document.getElementById(
"chartsSection"
)
.classList.remove(
"hidden"
);





document.getElementById(
"solarResult"
)
.innerHTML =
data.solarSize;





document.getElementById(
"batteryResult"
)
.innerHTML =
data.battery;





document.getElementById(
"savingsResult"
)
.innerHTML =

"$" +

data.estimatedSavings.toLocaleString()
+
" / year";





document.getElementById(
"paybackResult"
)
.innerHTML =

data.payback
+
" years";



}
