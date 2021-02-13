//Simple UWP translator based on information from Cepheus Light, Cepheus Engine SRD and https://travellermap.com/doc/secondsurvey#uwp

let UWPprofile = translate_code("text", "Enter UWP Code");

async function translate_code(type, prompt)
{
  let  value = await new Promise((resolve)=>{
	new Dialog({
		 modal: true,	 
		 title : `Input UWP Code`, 
		 content : `<table style="width:100%"><tr><th style="width:50%"><label>${prompt}</label></th><td style="width:50%"><input type="${type}" name="input"/></td></tr></table>`,
		 buttons : {
				 Ok : { label : `Ok`, callback : (html) => { resolve(html.find("input").val()); }}
				 }
	}).render(true);
  });

let parse = parse_code(value);
	
let value2 = await new Promise((resolve)=>{
	new Dialog({
		modal: true, 
		title : `UWP Translation for: ${value}`, 
		content: `<table style="width:100%;"><tbody><tr><th>Characteristic</th><th>Description</th></tr>${parse}</tbody></table>`,
		buttons : {
			Ok : { label : `Ok`, callback : (html) => { resolve(html.find("input").val()); }}
			}
	}).render(true);
  });
return;
}

function parse_code(UWPprofile){
//Strip out dash if used in profile
	UWPprofile = UWPprofile.replace("-", "");

	let UWPtables = ["Starport Type", "World Size - CL", "Atmosphere", "Hydrographics", "Population", "Government", "Law Level", "Tech Level - CL"];

//parse starport, this is non-numeric
	let message = `<tr><td style="padding-right:5px">${UWPtables[0]} (${UWPprofile[0]})</td><td>${starport_code(UWPprofile[0])}</td></tr>`;

//process rest of UWP
	for (let i = 1; i < Math.min(UWPprofile.length,UWPtables.length); i++) {
		message+=`<tr>${getUWPparameter(UWPprofile[i], UWPtables[i])}</tr>`;
		}
	
//generate trade codes
	message+=get_TradeC(UWPprofile);
	
	return(message);
};


//Lookup a hex digit from a roll table
function getUWPparameter (value, tableName) {
	let item = hexToBase10(value);
	const table = game.tables.entities.find(t => t.name === tableName);
	if (item < table.data.results.length){
		const r = new Roll(item );
		let details = table.roll({roll: r}).results[0].text
		return(`<td style="padding-right:5px">${tableName} (${value})</td><td>${details}</td>`);
	} else {
		return (`<td style="padding-right:5px">${tableName} (${value})</td><td>UNKNOWN TABLE ITEM</td>`);
	}
};

//Convert hex value to base10
function hexToBase10(value){
	switch(value.toUpperCase()) {
		case 'A': return('10');
		case 'B': return('11');
		case 'C': return('12');
		case 'D': return('13');
		case 'E': return('14');
		case 'F': return('15');
		case 'G': return('16');
		default: return(value);
	}
};

//Lookup starport description (letter values that are not hex)
function starport_code(value){
	let rtext=``;
	switch(value.toUpperCase()) {
		case 'A':
			rtext = `Excellent Quality. Refined fuel and annual maintenance overhaul available. Shipyard capable of constructing starships and non-starships present.`;
			break;
		case 'B':
			rtext = `Good Quality. Refined fuel and annual maintenance overhaul available. Shipyard capable of constructing non-starships present.`;
			break;
		case 'C':
			rtext = `Routine Quality. Only unrefined fuel available. Reasonable repair facilities present.`;
			break;
		case 'D':
			rtext = `Poor Quality. Only unrefined fuel available. No repair facilities present.`
			break;
		case 'E':
			rtext = `Frontier Installation. Essentially a marked spot of bedrock with no fuel, facilities, or bases present.`;
			break;
		case 'X':
			rtext = `No Starport. No provision is made for any ship landings.`;
			break;
		default:
			rtext = `Unknown`;
	}
	return (rtext);
};

//Generate Trade Codes per Cepheus Light Rules
function get_TradeC(UWPprofile){
	let rtext= ``;
	
	if (UWPprofile.length<8) {
		rtext += `UWP Code too short</td></tr>`;
	} else {
		let size = hexToBase10(UWPprofile[1]);
		let atmo = hexToBase10(UWPprofile[2]);
		let hydro = hexToBase10(UWPprofile[3]);
		let pop = hexToBase10(UWPprofile[4]);
		let techL = hexToBase10(UWPprofile[7]);
	
		if (atmo > 3 && atmo<10 && hydro>3 && hydro<9 && pop>4 && pop<8) {
			rtext +=`Ag - Agricultural, `;
		}
		
		if(size==0 && atmo==0 && hydro==0) {
			rtext +=`Asteroid, `;
		}
		
		//Get rid of extra coma and space
		if (rtext.length > 0) {
			rtext = rtext.slice(0,-2);
		}
		
		rtext+=`</td></tr>`;
	}
	
	return(`<tr><td "padding-right:5px">Trade Codes</td><td>${rtext}`);
};