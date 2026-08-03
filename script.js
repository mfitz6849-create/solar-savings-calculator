/*
========================================
Mark Fitzpatrick Solar Assessment Tool
Calculator Engine
========================================
*/


const GOOGLE_SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbwhYIuGbw5J40xxi96HealVEzKu--euANgvwC5LdVfNXmHUDylS-5jnhSfV0I9StNRO/exec";


let customer = {

property:"",
goal:"",
postcode:"",
bill:0,
solar:"",
battery:""

};


let charts = {};






function startCalculator(){

document.querySelector(".hero").style.display="none";

showStep("step1");

}








function showStep(step){


document.querySelectorAll(".step")
.forEach(function(el){

el.classList.remove("active");

});


document.getElementById(step)
.classList.add("active");


updateProgress(step);


}








function updateProgress(step){


let values={

step1:15,
step2:30,
step3:45,
step4:60,
step5:75,
step6:90,
results:100

};


let bar=document.getElementById("progressBar");


if(bar){

bar.style.width=
values[step]+"%";

}


}









function selectProperty(value){

customer.property=value;

showStep("step2");

}







function selectGoal(value){

customer.goal=value;

showStep("step3");

}








function nextStep(number){


if(number===4){


customer.postcode =
document.getElementById("postcode").value;



if(customer.postcode===""){

alert(
"Please enter your postcode"
);

return;

}


}



if(number===5){


customer.bill =
Number(
document.getElementById("bill").value
);


}



showStep(
"step"+number
);


}








function selectSolar(value){

customer.solar=value;

showStep("step6");

}








function selectBattery(value){

customer.battery=value;

calculateResults();

}









function calculateResults(){



let annualBill =
customer.bill * 4;



let usage =
annualBill / 0.35;







let solarSize;



if(usage < 7000){

solarSize = 6.6;

}

else if(usage < 12000){

solarSize = 10;

}

else if(usage < 18000){

solarSize = 13.2;

}

else{

solarSize = 20;

}







let battery;


if(usage < 9000){

battery="10kWh Battery";

}

else if(usage < 16000){

battery="15kWh Battery";

}

else{

battery="25kWh Battery";

}








let generation =
solarSize * 4.2 * 365;







let savings =
annualBill * 0.75;






let systemCost;



if(solarSize===6.6){

systemCost=9000;

}

else if(solarSize===10){

systemCost=13000;

}

else if(solarSize===13.2){

systemCost=17000;

}

else{

systemCost=25000;

}





let payback =

(systemCost / savings)
.toFixed(1);







let independence =

Math.min(

Math.round(
generation / usage * 100
),

95

);









document.getElementById("solarSize")
.innerHTML =
solarSize+
"kW Solar System";



document.getElementById("batterySize")
.innerHTML =
battery;



document.getElementById("savings")
.innerHTML =
"$"+
Math.round(savings)
+
" / year";



document.getElementById("payback")
.innerHTML =
payback+
" years";








createSavingsChart(
annualBill,
savings
);



createProjectionChart(
savings
);



createEnergyChart(
generation,
usage
);





showStep("results");



}









// GRAPH 1
// BEFORE AND AFTER BILL


function createSavingsChart(before,saving){



if(charts.savings){

charts.savings.destroy();

}



charts.savings =
new Chart(

document.getElementById("savingsChart"),

{

type:"bar",

data:{


labels:[

"Before Solar",

"After Solar"

],


datasets:[{

label:
"Annual Electricity Cost",

data:[

before,

before-saving

]


}]

},


options:{

responsive:true

}


});


}









// GRAPH 2
// 25 YEAR SAVINGS


function createProjectionChart(saving){


if(charts.projection){

charts.projection.destroy();

}



let years=[];

let values=[];



for(let i=1;i<=25;i++){


years.push(
"Year "+i
);


values.push(
Math.round(
saving*i
)
);


}






charts.projection =

new Chart(

document.getElementById("projectionChart"),

{

type:"line",

data:{


labels:years,


datasets:[{

label:
"Total Savings ($)",

data:values

}]

},


options:{

responsive:true

}


});


}









// GRAPH 3
// ENERGY MIX


function createEnergyChart(
solar,
usage
){



if(charts.energy){

charts.energy.destroy();

}



charts.energy =

new Chart(

document.getElementById("energyChart"),

{

type:"doughnut",

data:{


labels:[

"Solar Energy",

"Grid Energy"

],


datasets:[{


data:[

solar,

Math.max(
usage-solar,
0
)

]


}]

},


options:{

responsive:true

}


});


}









// SEND LEAD


document.addEventListener(
"DOMContentLoaded",

function(){



let form =
document.getElementById("leadForm");



if(form){



form.addEventListener(
"submit",

function(e){


e.preventDefault();



let lead={


name:
document.getElementById("name").value,


email:
document.getElementById("email").value,


phone:
document.getElementById("phone").value,


property:
customer.property,


goal:
customer.goal,


postcode:
customer.postcode,


electricity:
customer.bill,


solar:
document.getElementById("solarSize").innerText,


battery:
document.getElementById("batterySize").innerText,


savings:
document.getElementById("savings").innerText


};





fetch(

GOOGLE_SCRIPT_URL,

{

method:"POST",

mode:"no-cors",

body:
JSON.stringify(lead)

}

);





alert(

"Thanks! Your personalised solar proposal request has been received."

);


}



);


}



});