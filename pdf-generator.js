/*
==================================================
Solar Savings Assessment
PDF Generator

Prepared by:
Mark Fitzpatrick
Renewable Energy Specialist

==================================================
*/


async function generateProposal(){



if(!window.jspdf){


alert(
"PDF library not loaded."
);


return;


}





const { jsPDF } = window.jspdf;



const doc = new jsPDF(
"p",
"mm",
"A4"
);







const customer =

getLeadData();




const assessment =

window.assessmentResults;







if(!assessment){


alert(
"No assessment data available."
);


return;


}







const today =

new Date()

.toLocaleDateString(
"en-AU"
);









/*
----------------------------------
Page 1 Cover
----------------------------------
*/


doc.setFillColor(
0,
102,
161
);


doc.rect(
0,
0,
210,
45,
"F"
);




doc.setTextColor(
255,
255,
255
);


doc.setFontSize(
24
);


doc.text(

"Mark Fitzpatrick",

20,

25

);




doc.setFontSize(
13
);


doc.text(

"Renewable Energy Specialist",

20,

35

);





doc.setTextColor(
0,
0,
0
);





doc.setFontSize(
22
);


doc.text(

"Solar Savings Assessment",

20,

80

);




doc.setFontSize(
14
);


doc.text(

"Prepared for:",

20,

105

);





doc.setFontSize(
18
);


doc.text(

customer.name || "Customer",

20,

120

);





doc.setFontSize(
11
);


doc.text(

"Assessment Date: " + today,

20,

135

);







doc.text(

"M: 0434 151 237",

20,

220

);



doc.text(

"mark.fitzpatrick@classaenergy.com.au",

20,

230

);



doc.text(

"ABN: 40 893 359 837",

20,

240

);











/*
----------------------------------
Page 2 Summary
----------------------------------
*/


doc.addPage();



doc.setFontSize(
20
);



doc.text(

"Recommended Energy Solution",

20,

30

);




let summary = [

"Property Type: " + assessment.property,


"Solar System: " + assessment.solarSize,


"Battery: " + assessment.battery,


"Estimated Annual Savings: $" +

Number(

assessment.estimatedSavings

)

.toLocaleString(),



"Estimated Payback: " +

assessment.payback +

" years"

];





let y=60;



summary.forEach(

function(item){


doc.roundedRect(

20,

y-10,

170,

18,

3,

3

);


doc.setFontSize(
12
);


doc.text(

item,

30,

y+2

);


y+=30;



}

);









/*
----------------------------------
Graphs
----------------------------------
*/



addChartToPDF(

doc,

"costChart",

"Electricity Cost Comparison"

);




addChartToPDF(

doc,

"savingsChart",

"25 Year Savings Projection"

);




addChartToPDF(

doc,

"energyChart",

"Energy Independence"

);









/*
----------------------------------
Final page
----------------------------------
*/


doc.addPage();



doc.setFontSize(
22
);


doc.text(

"Next Steps",

20,

35

);



doc.setFontSize(
13
);



doc.text(

[

"Your Solar Savings Assessment provides an initial estimate.",

"",

"Next steps:",

"",

"✓ Confirm energy usage",

"✓ Final system design",

"✓ Battery optimisation",

"✓ Installation options"

],

20,

65

);






doc.save(

"Solar_Savings_Assessment_" +

(customer.name || "Customer")

+

".pdf"

);



}









function addChartToPDF(

doc,

canvasID,

title

){



const canvas =

document.getElementById(
canvasID
);




if(!canvas){

return;

}





doc.addPage();



doc.setFontSize(
18
);



doc.text(

title,

20,

30

);




const image =

canvas.toDataURL(
"image/png",
1.0
);





doc.addImage(

image,

"PNG",

20,

45,

170,

100

);



}
