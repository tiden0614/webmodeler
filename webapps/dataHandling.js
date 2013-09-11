//Global variables
//ID of objects
var id = 0;

// Servlet URL
var url = "./DataHandler";

// Send to the server the XML type stream, which contains
// info of objects
function sendXML(xml) {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			alert("readyState: " + xmlHttp.readyState + "\nstatus: "
					+ xmlHttp.status + "\nresponseText: "
					+ xmlHttp.responseText);
		}
	};
	xmlHttp.open("POST", url, true);
	xmlHttp.setRequestHeader("type", "save");
	xmlHttp.send(xml);
}

// Load XML info of objects form the server and paint them on canvas
function loadXML() {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			alert("readyState: " + xmlHttp.readyState + "\nstatus: "
					+ xmlHttp.status + "\nloadXML OK.");
			analyseXML(xmlHttp.responseXML);

		}

	};
	xmlHttp.open("POST", url, true);
	xmlHttp.setRequestHeader("type", "load");
	xmlHttp.send();
}

function analyseXML(doc) {
	// Analyze XML using jQuery
	$(doc).find('entity').each(function(i) {
		var id = $(this).children('id').text();
		var type = $(this).children('type').text();
		var text = $(this).children('text').text();
		var width = $(this).children('width').text();
		var height = $(this).children('height').text();
		var x = $(this).children('x').text();
		var y = $(this).children('y').text();
		var color = $(this).children('color').text();

		x = new Number(x);
		y = new Number(y);
		width = new Number(width);
		height = new Number(height);
		id = new Number(id);

		if (type == "Class") {
			var _class = buildClass(x, y, text, id, width, height);
			$(this).find('attr').each(function(i) {
				var attr = $(this).attr('value');
				_class.addAttr(attr, true);
			});
			$(this).find('meth').each(function(i) {
				var meth = $(this).attr('value');
				_class.addMeth(meth, true);
			});
		} else if (type == "Usecase") {
			buildUseCase(x, y, text, id);
		} else if (type == "User") {
			buildUser(x, y, text, id);
		} else if (type == "SystemBoundary") {
			var sysBdy = buildSystemBoundary(x, y, text, id, width, height);
			$(this).find('cont').each(function(i) {
				var contId = $(this).attr('id');
				sysBdy.addContent(contId);
			});
		} else if (type == "Pakage") {
			var pakage = buildPakage(x, y, text, id, width, height);
			$(this).find('cont').each(function(i) {
				var contId = $(this).attr('id');
				pakage.addContent(contId);
			});
		}

	});

	$(doc).find('relation').each(function(i) {
		var x1 = Number($(this).attr('x1'));
		var y1 = Number($(this).attr('y1'));
		var x2 = Number($(this).attr('x2'));
		var y2 = Number($(this).attr('y2'));
		var sourceId = Number($(this).attr('sourceId'));
		var terminalId = Number($(this).attr('terminalId'));
		var nameText = $(this).attr('name');
		addLines(x1, y1, x2, y2, sourceId, terminalId, nameText);
	});

	$(doc).find('lastId').each(function(i) {
		_lastId += Number($(this).attr('value'));
	});
}

// generate XML content
function generateXML() {
	var xml = "<?xml version='1.0' encoding='UTF-8'?><root>";
	for ( var k = 0; k < _objects.length; k++) {
		var a = _objects[k];
		if (a.length > 0) {
			xml += "<" + a.type + ">";

			for ( var i = 0; i < a.length; i++) {
				xml += a[i].getXML();
			}

			xml += "</" + a.type + ">";
		}
	}
	xml += "<lastId value='" + (_lastId).toString() + "' /></root>";
	return xml;
}
