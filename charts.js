/*
==================================================
Solar Savings Assessment
Chart Generator

Prepared by:
Mark Fitzpatrick
Renewable Energy Specialist

==================================================
*/


let costChart;
let savingsChart;
let energyChart;






function createCharts(){



const assessment =

window.assessmentResults;



if(!assessment){

return;

}







/*
----------------------------------
Data preparation
----------------------------------
*/


const annualBill =

Number(
assessment.annualBill
);



const savings =

Number(
assessment.estimatedSavings
);



const remainingCost =

Math.max(

annualBill - savings,

0

);







/*
----------------------------------
Chart 1
Electricity Cost Comparison
----------------------------------
*/


const costCanvas =

document.getElementById(
"costChart"
);



if(costCanvas){



if(costChart){

costChart.destroy();

}





costChart = new Chart(

costCanvas,

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

annualBill,

remainingCost

]

}]

},




options:{


responsive:true,


plugins:{


title:{


display:true,


text:

"Electricity Cost Reduction"


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
----------------------------------
Chart 2
25 Year Savings
----------------------------------
*/


const years = [];

const projection = [];



let total = 0;




for(
let i=1;
i<=25;
i++
){


years.push(i);


total += savings;


projection.push(total);


}






const savingsCanvas =

document.getElementById(
"savingsChart"
);





if(savingsCanvas){



if(savingsChart){

savingsChart.destroy();

}




savingsChart = new Chart(

savingsCanvas,

{


type:"line",



data:{


labels:years,



datasets:[{


label:

"Cumulative Savings",



data:projection



}]

},



options:{


responsive:true,


plugins:{


title:{


display:true,


text:

"25 Year Savings Projection"


}


}



}



}



);



}











/*
----------------------------------
Chart 3
Energy Independence
----------------------------------
*/


const solarContribution = 75;



const gridContribution = 25;





const energyCanvas =

document.getElementById(
"energyChart"
);





if(energyCanvas){



if(energyChart){

energyChart.destroy();

}





energyChart = new Chart(

energyCanvas,

{


type:"doughnut",



data:{


labels:[

"Solar & Battery",

"Grid Electricity"

],



datasets:[{


label:

"Energy Source",


data:[

solarContribution,

gridContribution

]


}]

},




options:{


responsive:true,


plugins:{


title:{


display:true,


text:

"Estimated Energy Independence"


}


}



}



}



);



}




}
