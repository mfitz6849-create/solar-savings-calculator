/*
==================================================
Solar Savings Assessment
Lead Capture System

Prepared by:
Mark Fitzpatrick
Renewable Energy Specialist

Google Sheets Integration

==================================================
*/


const GOOGLE_SCRIPT_URL =

"https://script.google.com/macros/s/AKfycbxAuMeIm7Z5-_0fOpj2Cn3dTeYFi61YpLhuOFrqsmbJeeBByzF-YRd2OsZLnAmvNh4b/exec";









function captureLead(){



console.log(
"Capture lead started"
);





const button =

document.getElementById(
"sendReportButton"
);






const name =

document.getElementById(
"leadName"
)
.value
.trim();





const mobile =

document.getElementById(
"leadMobile"
)
.value
.trim();





const email =

document.getElementById(
"leadEmail"
)
.value
.trim();






if(
!name ||
!mobile ||
!email
){


alert(
"Please enter your name, mobile number and email."
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









if(button){


button.innerHTML =

"Preparing Your Report...";


button.disabled = true;


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



postcode:

document.getElementById(
"postcode"
)?.value || "",



ownership:

document.getElementById(
"ownership"
)?.value || "",



property:

assessment.property,



annualBill:

assessment.annualBill,



solar:

assessment.solarSize,



battery:

assessment.battery,



savings:

assessment.estimatedSavings,



payback:

assessment.payback



};









console.log(
"Lead:",
lead
);









// Local backup


localStorage.setItem(

"solarAssessmentLead",

JSON.stringify(
lead
)

);









// Send to Google Sheets


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

function(){


console.log(
"Lead sent"
);


}

)

.catch(

function(error){


console.error(
"Lead error:",
error
);


}

);









alert(

"Thank you " +

name +

". Your Solar Savings Assessment report is being prepared."

);











setTimeout(

function(){



if(

typeof generateProposal === "function"

){


generateProposal();


}

else{


console.error(
"PDF generator not loaded"
);


}




if(button){


button.innerHTML =

"Send My Solar Report";


button.disabled = false;


}



},

1500

);





}









function getLeadData(){



return JSON.parse(

localStorage.getItem(
"solarAssessmentLead"
)

)

||

{};



}
