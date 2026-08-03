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
"PDF system not loaded."
);


return;


}






const { jsPDF } = window.jspdf;



const doc = new jsPDF(
"p",
"mm",
"A4"
);






const assessment =

window.assessmentResults;





const customer =

getLeadData();






if(!assessment){


alert(
"Complete the assessment before generating the report."
);


return;


}








const date =

new Date()

.toLocaleDateString(
"en-AU"
);







/*
=====================================
PAGE 1 COVER
=====================================
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

50,

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

37

);







doc.setTextColor(
0,
0,
0
);





doc.setFontSize(
24
);



doc.text(

"Solar Savings",

20,

85

);



doc.text(

"Assessment Report",

20,

98

);







doc.setFontSize(
14
);



doc.text(

"Prepared for:",

20,

130

);



doc.setFontSize(
18
);



doc.text(

customer.name || "Customer",

20,

145

);







doc.setFontSize(
12
);



doc.text(

"Assessment Date: " + date,

20,

160

);







// Photo


const photo =

document.getElementById(
"profilePhoto"
);





if(photo){



try{


doc.addImage(

photo,

"PNG",

155,

70,

35,

45

);



}

catch(e){


console.log(
"Photo unavailable"
);


}



}









doc.setFontSize(
11
);



doc.text(

"M: 0434 151 237",

20,

230

);



doc.text(

"mark.fitzpatrick@classaenergy.com.au",

20,

240

);



doc.text(

"ABN: 40 893 359 837",

20,

250

);










/*
=====================================
PAGE 2 SUMMARY
=====================================
*/


doc.addPage();



doc.setFontSize(
22
);



doc.text(

"Recommended Solar Solution",

20,

30

);







const summary = [



"Property Type: " +

assessment.property,



"Solar System: " +

assessment.solarSize,



"Battery Recommendation: " +

assessment.battery,



"Estimated Annual Savings: $" +

Number(

assessment.estimatedSavings

)

.toLocaleString(),



"Estimated Payback: " +

assessment.payback +

" years"



];








let y = 65;



summary.forEach(

function(line){



doc.roundedRect(

20,

y-10,

170,

20,

3,

3

);



doc.setFontSize(
12
);



doc.text(

line,

30,

y+3

);



y += 30;



}

);











/*
=====================================
PAGE 3 COST GRAPH
=====================================
*/


addGraphPage(

doc,

"Electricity Cost Comparison",

"costChart"

);






/*
=====================================
PAGE 4 SAVINGS GRAPH
=====================================
*/


addGraphPage(

doc,

"25 Year Savings Projection",

"savingsChart"

);







/*
=====================================
PAGE 5 ENERGY GRAPH
=====================================
*/


addGraphPage(

doc,

"Energy Independence",

"energyChart"

);











/*
=====================================
PAGE 6 NEXT STEPS
=====================================
*/


doc.addPage();




doc.setFontSize(
22
);



doc.text(

"Your Next Steps",

20,

35

);







doc.setFontSize(
13
);



doc.text(

[

"Your assessment provides an initial solar opportunity estimate.",

"",

"Recommended next steps:",

"",

"✓ Review your electricity usage",

"✓ Confirm system design",

"✓ Review battery options",

"✓ Discuss installation timing"

],

20,

70

);






doc.setFontSize(
12
);



doc.text(

"Prepared by Mark Fitzpatrick",

20,

220

);



doc.text(

"Renewable Energy Specialist",

20,

230

);



doc.text(

"M: 0434 151 237",

20,

240

);



doc.text(

"mark.fitzpatrick@classaenergy.com.au",

20,

250

);



doc.text(

"ABN: 40 893 359 837",

20,

260

);









doc.save(

"Solar_Savings_Assessment_" +

(customer.name || "Customer")

+

".pdf"

);







}









function addGraphPage(

doc,

title,

canvasID

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
20
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

50,

170,

100

);




}
