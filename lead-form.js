/*
==================================================
Solar Savings Assessment
Lead Capture System

Mark Fitzpatrick
Renewable Energy Specialist

==================================================
*/


const GOOGLE_SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbzshCCI99nyGWmAhca3oEsk1gNQTXmbqyF5Pi8KMxqTYWmzVLA8wCVTtkiVs4stN0uR/exec";



function captureLead(){


console.log("captureLead started");


const name =
document.getElementById("leadName").value;


const mobile =
document.getElementById("leadMobile").value;


const email =
document.getElementById("leadEmail").value;



if(!name || !mobile || !email){


alert(
"Please enter your name, mobile number and email."
);


return;

}




let assessment = window.assessmentResults;



if(!assessment){


assessment = {


property:"Residential",

annualBill:"",

solarSize:"",

battery:"",

estimatedSavings:"",

payback:""


};


}





const lead = {


date:
new Date().toLocaleString("en-AU"),


name:name,


mobile:mobile,


email:email,


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
lead
);





localStorage.setItem(

"solarLead",

JSON.stringify(lead)

);







fetch(

GOOGLE_SCRIPT_URL,

{


method:"POST",


mode:"no-cors",


headers:{


"Content-Type":"application/json"

},


body:

JSON.stringify(lead)


}

)

.then(function(){


console.log(
"Lead submitted"
);


})

.catch(function(error){


console.error(
error
);


});






alert(

"Thank you " 
+
name
+
". Your Solar Savings Assessment is being prepared."

);





if(typeof generateProposal === "function"){


generateProposal();


}



}
