/*
==================================================
Solar Savings Assessment
Lead Capture System

Prepared by:
Mark Fitzpatrick
Renewable Energy Specialist

==================================================
*/


const GOOGLE_SCRIPT_URL =

"https://script.google.com/macros/s/AKfycbzshCCI99nyGWmAhca3oEsk1gNQTXmbqyF5Pi8KMxqTYWmzVLA8wCVTtkiVs4stN0uR/exec";





function captureLead(){


console.log("captureLead started");



// Get customer details


const name = document.getElementById("leadName")?.value || "";

const mobile = document.getElementById("leadMobile")?.value || "";

const email = document.getElementById("leadEmail")?.value || "";





if(name === "" || mobile === "" || email === ""){


alert(
"Please enter your name, mobile number and email."
);


return;


}





// Get calculator results


let assessment = window.assessmentResults;





// Safety fallback for testing


if(!assessment){


console.log(
"No assessment results found"
);


assessment = {


property:"Residential",

annualBill:0,

solarSize:"Assessment required",

battery:"Assessment required",

estimatedSavings:0,

payback:"TBC"


};


}







const lead = {


date:new Date().toLocaleString("en-AU"),


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







console.log(
"Sending lead:",
lead
);






// Save local backup


localStorage.setItem(

"solarLead",

JSON.stringify(lead)

);







// Send to Google Sheets


fetch(

GOOGLE_SCRIPT_URL,

{


method:"POST",


mode:"no-cors",


headers:{


"Content-Type":"application/json"

},


body:JSON.stringify(lead)


}

)

.then(function(){


console.log(
"Lead sent"
);


})

.catch(function(error){


console.error(
"Lead error:",
error
);


});








alert(

"Thank you " 
+
name
+
".

Your Solar Savings Assessment is being prepared."

);








// Create browser PDF if available


if(typeof generateProposal === "function"){


setTimeout(function(){


generateProposal();


},1000);


}



}






// Test function

function testLead(){


window.assessmentResults={


property:"Residential",

annualBill:5000,

solarSize:"10kW Solar System",

battery:"13.5kWh Battery",

estimatedSavings:3200,

payback:4


};



console.log(
"Test assessment loaded"
);


}
