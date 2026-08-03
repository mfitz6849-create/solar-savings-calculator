/*
==================================================
Solar Savings Assessment
Interactive Charts

Prepared by:
Mark Fitzpatrick
Renewable Energy Specialist

==================================================
*/


let costChart;

let savingsChart;

let energyChart;







function createCharts(){



const data = window.assessmentResults;



if(!data){

return;

}







/*
----------------------------------
Calculate chart values
----------------------------------
*/


const annualBill =

Number(
data.annualBill
);



const annualSavings =

Number(
data.estimatedSavings
);



const remainingCost =

Math.max(
annualBill - annualSavings,
0
);









/*
----------------------------------
Chart 1
Before vs After Solar
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

"Electricity Cost Comparison"


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


const projection=[];


let total=0;



for(
let year=1;
year<=25;
year++
){


total += annualSavings;


projection.push(
total
);


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


labels:[

1,5,10,15,20,25

],



datasets:[{


label:

"25 Year Savings"



,

data:[

projection[0],

projection[4],

projection[9],

projection[14],

projection[19],

projection[24]

]


}]

},



options:{


responsive:true,


plugins:{


title:{


display:true,


text:

"Long Term Savings Projection"


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


const solarPercent = 75;


const gridPercent = 25;




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

"Solar Energy",

"Grid Energy"

],



datasets:[{


data:[

solarPercent,

gridPercent

]


}]

},



options:{


responsive:true,


plugins:{


title:{


display:true,


text:

"Energy Independence"


}


}


}


}



);



}





}
