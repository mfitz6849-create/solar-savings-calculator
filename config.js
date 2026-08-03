/*
==================================================
Solar Savings Assessment

Configuration Settings

Prepared by:
Mark Fitzpatrick
Renewable Energy Specialist

==================================================
*/


const SOLAR_CONFIG = {


/*
----------------------------------
Business Branding
----------------------------------
*/


businessName:

"Mark Fitzpatrick Solar Savings Assessment",


contactName:

"Mark Fitzpatrick",


position:

"Renewable Energy Specialist",


mobile:

"0434 151 237",


email:

"mark.fitzpatrick@classaenergy.com.au",


abn:

"40 893 359 837",





/*
----------------------------------
Solar Assumptions
----------------------------------
*/


solarProductionPerKW:

1400,


// Approximate annual kWh production
// per installed kW in Australia



electricityRate:

0.35,


// Estimated electricity cost
// $/kWh



feedInRate:

0.08,





/*
----------------------------------
System Size Rules
----------------------------------
*/


systemSizes:{



Residential:{


minimum:

5,


maximum:

15,


default:

8


},



Business:{


minimum:

10,


maximum:

50,


default:

20


},



Commercial:{


minimum:

30,


maximum:

200,


default:

50


},



Farming:{


minimum:

20,


maximum:

300,


default:

50


}


},






/*
----------------------------------
Battery Recommendations
----------------------------------
*/


batteryOptions:{


none:{


size:

"No Battery",


capacity:

0


},



small:{


size:

"10kWh Battery",


capacity:

10


},



medium:{


size:

"20kWh Battery",


capacity:

20


},



large:{


size:

"30kWh+ Battery",


capacity:

30


}


},






/*
----------------------------------
Battery Selection Logic
----------------------------------
*/


batteryThresholds:{


low:

400,


medium:

800,


high:

1200


},






/*
----------------------------------
Savings Model
----------------------------------
*/


selfConsumptionTarget:

0.75,



// Percentage of solar used directly



systemLife:

25,


// Years used for projection



}


;
