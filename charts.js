/*
==================================================
Solar Savings Assessment Charts

Prepared by:
Mark Fitzpatrick
Renewable Energy Specialist

Creates:
1. Current vs Solar Electricity Costs
2. 25 Year Savings Projection
3. Solar Investment Opportunity

Requires:
Chart.js

==================================================
*/


let costComparisonChart;

let savingsProjectionChart;

let opportunityChart;








function refreshCharts(){


const results =

window.assessmentResults;



if(!results){

return;

}



createCostComparison(results);


createSavingsProjection(results);


createOpportunityChart(results);



}








/*
==================================================
GRAPH 1

CURRENT ENERGY COST VS SOLAR

==================================================
*/


function createCostComparison(results){



const canvas =

document.getElementById(
"savingsChart"
);



if(!canvas){

return;

}



if(costComparisonChart){

costComparisonChart.destroy();

}







const currentCost =

results.annualBill;



const solarCost =

Math.max(

currentCost -
results.estimatedSavings,

0

);







costComparisonChart =

new Chart(

canvas,

{


type:"bar",



data:{



labels:[


"Current Electricity",

"After Solar"


],



datasets:[{


label:

"Estimated Annual Cost",



data:[


currentCost,


solarCost


]



}]



},




options:{



responsive:true,



plugins:{



title:{



display:true,


text:

"Potential Electricity Cost Reduction"



},



legend:{


display:false


}



}



}


}

);



}









/*
==================================================
GRAPH 2

25 YEAR SAVINGS

==================================================
*/


function createSavingsProjection(results){



const canvas =

document.getElementById(
"projectionChart"
);



if(!canvas){

return;

}



if(savingsProjectionChart){

savingsProjectionChart.destroy();

}





let years=[];

let savings=[];


let total=0;







for(
let year=1;
year<=25;
year++
){



total +=

results.estimatedSavings;



years.push(

year

);



savings.push(

Math.round(total)

);



}







savingsProjectionChart =

new Chart(

canvas,

{


type:"line",



data:{



labels:years,



datasets:[{


label:

"Cumulative Savings ($)",



data:savings,



fill:true



}]



},




options:{



responsive:true,



plugins:{



title:{



display:true,


text:

"25 Year Solar Savings Potential"



}



}



}


}

);



}









/*
==================================================
GRAPH 3

SOLAR OPPORTUNITY

==================================================
*/


function createOpportunityChart(results){



const canvas =

document.getElementById(
"energyChart"
);



if(!canvas){

return;

}



if(opportunityChart){

opportunityChart.destroy();

}








const systemCost =

results.systemCost;



const savings =

results.estimatedSavings;







opportunityChart =

new Chart(

canvas,

{


type:"doughnut",




data:{



labels:[


"Solar Investment",

"Annual Savings"


],



datasets:[{


data:[


systemCost,


savings


]



}]



},




options:{



responsive:true,



plugins:{



title:{



display:true,


text:

"Solar Investment Opportunity"



}



}



}


}

);



}