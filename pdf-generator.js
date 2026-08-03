/*
==================================================
Solar Savings Assessment PDF Generator

Prepared by:
Mark Fitzpatrick
Renewable Energy Specialist

Creates:
Personalised Solar Savings Assessment Report

==================================================
*/


async function generateProposal(){


const { jsPDF } = window.jspdf;


const doc = new jsPDF(
"p",
"mm",
"A4"
);



const results =

window.assessmentResults;



if(!results){


alert(
"Please complete your solar assessment first."
);


return;


}




const customer =

document.getElementById(
"name"
)?.value ||

"Customer";



const date =

new Date()

.toLocaleDateString(
"en-AU"
);





function money(value){


return new Intl.NumberFormat(
"en-AU",
{

style:"currency",

currency:"AUD",

maximumFractionDigits:0

}

)

.format(value || 0);


}








// ===================================
// COVER PAGE
// ===================================


doc.setFillColor(
0,
92,
151
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



doc.setFontSize(25);



doc.text(

"Solar Savings Assessment",

20,

25

);



doc.setFontSize(13);



doc.text(

"Prepared by Mark Fitzpatrick",

20,

35

);





// Photo

try{


doc.addImage(

"mark-photo.png",

"PNG",

155,

8,

30,

40

);


}

catch(e){

console.log(
"Photo unavailable"
);

}






doc.setTextColor(
0,
0,
0
);




doc.setFontSize(22);



doc.text(

"Personalised Solar",

20,

85

);



doc.text(

"Savings Report",

20,

97

);







doc.setFontSize(14);



doc.text(

"Prepared for:",

20,

130

);



doc.setFontSize(20);



doc.text(

customer,

20,

145

);





doc.setFontSize(11);



doc.text(

"Assessment Date: "
+
date,

20,

160

);









// ===================================
// ASSESSMENT SUMMARY
// ===================================


doc.addPage();




doc.setFontSize(22);



doc.text(

"Your Solar Opportunity",

20,

25

);







const summary = [


[
"Property Type",

results.property

],


[
"Current Electricity Cost",

money(
results.annualBill
)
+
" / year"

],


[
"Recommended Solar System",

results.solarSize

],


[
"Recommended Battery",

results.battery

],


[
"Estimated Annual Savings",

money(
results.estimatedSavings
)

],


[
"Estimated Payback",

results.payback +
" years"

]

];







let y=55;



summary.forEach(item=>{



doc.roundedRect(

20,

y-8,

170,

20,

3,

3

);



doc.setFontSize(12);



doc.text(

item[0],

30,

y+5

);



doc.text(

item[1],

120,

y+5

);



y += 28;



});









// ===================================
// EXPLANATION PAGE
// ===================================


doc.addPage();



doc.setFontSize(20);



doc.text(

"How Your Assessment Was Calculated",

20,

30

);



doc.setFontSize(13);



doc.text(

[

"This estimate is based on:",

"",

"• Your property type",

"• Approximate electricity usage",

"• Current energy costs",

"• Typical solar generation",

"• Battery storage suitability",

"",

"A detailed site assessment will confirm the final system design."

],

20,

60

);









// ===================================
// NEXT STEPS PAGE
// ===================================


doc.addPage();



doc.setFontSize(22);



doc.text(

"Your Next Steps",

20,

35

);



doc.setFontSize(13);



doc.text(

[

"✓ Review your solar opportunity",

"",

"✓ Confirm roof and energy requirements",

"",

"✓ Finalise solar and battery design",

"",

"✓ Discuss installation options",

"",

"✓ Start reducing energy costs"

],

20,

70

);









// ===================================
// CONTACT PAGE
// ===================================


doc.setFontSize(16);



doc.text(

"Mark Fitzpatrick",

20,

220

);



doc.setFontSize(12);



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

"Solar_Savings_Assessment_"

+

customer

+

".pdf"

);



}