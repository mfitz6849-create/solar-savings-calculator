/*
==================================================
Solar Savings Assessment Lead Capture

Prepared by:
Mark Fitzpatrick
Renewable Energy Specialist

Google Sheets Integration Enabled

==================================================
*/


const GOOGLE_SCRIPT_URL =

"https://script.google.com/macros/s/AKfycbyrBLY5ggnS5tMEC9598ulwna1Nu37jC2KVA7quxiBN3kfHBeSZlav4VEjHXYYS4ED2/exec";









function captureLead(){



const name =

document.getElementById(
"leadName"
)?.value.trim();



const mobile =

document.getElementById(
"leadMobile"
)?.value.trim();



const email =

document.getElementById(
"leadEmail"
)?.value.trim();








if(
!name ||
!mobile ||
!email

){


alert(

"Please enter your name, mobile and email before continuing."

);


return;


}








const assessment =

window.assessmentResults;






if(!assessment){


alert(

"Please complete the Solar Savings Assessment first."

);


return;


}








const lead = {



date:

new Date()

.toLocaleString(
"en-AU"
),



name:name,



mobile:mobile,



email:email,



property:

assessment.property || "",



annualBill:

assessment.annualBill || "",



solar:

assessment.solarSize || "",



battery:

assessment.battery || "",



savings:

assessment.estimatedSavings || "",



payback:

assessment.payback || ""



};









// Save backup copy


localStorage.setItem(

"solarAssessmentLead",

JSON.stringify(
lead
)

);









// Send to Google Sheet


fetch(

GOOGLE_SCRIPT_URL,

{


method:"POST",


mode:"no-cors",


headers:{


"Content-Type":

"application/json"


},



body:

JSON.stringify(
lead
)


}

)

.then(

()=>{


console.log(
"Lead sent successfully"
);


}

)

.catch(

(error)=>{


console.log(
"Lead error:",
error
);


}

);









alert(

"Thank you " 
+
name
+
".

Your Solar Savings Assessment report is being prepared."

);







// Generate PDF


setTimeout(

function(){


if(
typeof generateProposal === "function"

){


generateProposal();


}



},

1000

);



}









function getLeadData(){


return JSON.parse(

localStorage.getItem(
"solarAssessmentLead"
)

)

|| {};

}