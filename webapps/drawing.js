//
// Startup
//
// global
var _isDown, _timeout = false,_points, _strokes, _r, _g, _rc, canvas, evt, _scrollerWannaDown = true, _usingGestures;
// variables
var _usecase = new Array();
var _class = new Array();
var _user = new Array();
var _line = new Array();
var _sysBdry = new Array();
var _pakage = new Array();
var _objects = new Array();
var _lastId = 0;
var _wannaConn = false;
var _curConnUser = null;
var labelContentCaller;
var stage, usecaseEntityLayer, usecaseLineLayer, usecaseSBYLayer;
var classStage, classEntityLayer, classLineLayer, classPakageLayer;
var _usecaseLayers = new Array(), _classLayers = new Array();
var _gesLayer;
var _store, _tree;
var _usecaseGroup;
var _curStage;
var _gesPoints = new Array();
var _gesLines = new Array();

var _lineRelationRect;
var _drawingLineHead = false;
var _tempObj;
var _lineHeadPoints;
var _drawingLineHeadLine;
// Consts
var PI = Math.PI, PI_2 = PI / 2, infiniteDistance = 1960000;

function initArrays() {
	_usecase.type = "usecases";
	_usecase._lastId = 0;
	_class.type = "classes";
	_class._lastId = 0;
	_user.type = "users";
	_user._lastId = 0;
	_sysBdry.type = "systemboundaries";
	_pakage.type = "pakages";
	_line.type = "relations";
	_objects.push(_user);
	_objects.push(_usecase);
	_objects.push(_sysBdry);
	_objects.push(_class);
	_objects.push(_pakage);
	_objects.push(_line);
	_usecaseLayers.push(usecaseEntityLayer);
	_usecaseLayers.push(usecaseLineLayer);
	_usecaseLayers.push(usecaseSBYLayer);
	_classLayers.push(classEntityLayer);
	_classLayers.push(classLineLayer);
	_classLayers.push(classPakageLayer);
}

Kinetic.Group.prototype.getXML = function() {
	var s = "<entity>";
	s += "<type>" + this.type + "</type>";
	s += "<id>" + this.id + "</id>";
	s += "<text>" + this.elements[1].getText() + "</text>";
	s += "<width>" + this.elements[0].getWidth() + "</width>";
	s += "<height>" + this.elements[0].getHeight() + "</height>";
	s += "<x>" + this.currentX + "</x>";
	s += "<y>" + this.currentY + "</y>";
	s += "<color>" + this.elements[0].getFill() + "</color>";
	if (this.type == 'Class') {
		s += "<attributes>" + this.getAttributes() + "</attributes>";
		s += "<methods>" + this.getMethods() + "</methods>";
	} else if (this.type == 'SystemBoundary' || this.type == 'Pakage') {
		s += "<content>" + this.getContent() + "</content>";
	}
	s += "</entity>";
	return s;
};

Kinetic.Line.prototype.getXML = function() {
	var p = this.getPoints();
	var x1 = p[0].x;
	var y1 = p[0].y;
	var x2 = p[1].x;
	var y2 = p[1].y;
	var sourceId = this.source.id;
	var terminalId = this.terminal.id;
	var name = this.name.getText();
	var s = '<relation ';
	s += "x1='" + x1 + "' ";
	s += "y1='" + y1 + "' ";
	s += "x2='" + x2 + "' ";
	s += "y2='" + y2 + "' ";
	s += "sourceId='" + sourceId + "' ";
	s += "terminalId='" + terminalId + "' ";
	s += "name='" + name + "' ";
	s += '/>';
	return s;
};

function onLoadEvent() {
	_points = new Array(); // point array for current stroke
	_strokes = new Array(); // array of point arrays
	_r = new NDollarRecognizer(document
			.getElementById('useBoundedRotationInvariance').checked);

	canvas = document.getElementById('myCanvas');
	if ('createTouch' in document) {
		canvas.addEventListener('touchstart', onCanvasTouchStart, false);
		canvas.addEventListener('touchmove', onCanvasTouchMove, false);
		canvas.addEventListener('touchend', onCanvasTouchEnd, false);
	} else {
		canvas.addEventListener('mousedown', onMouseDown, false);
		canvas.addEventListener('mousemove', onMouseMove, false);
		canvas.addEventListener('mouseup', onMouseUp, false);
	}
	_g = canvas.getContext('2d');
	_g.lineWidth = 3;
	_g.font = "16px Gentilis";
	_rc = getCanvasRect(canvas); // canvas rect on page
	_g.fillStyle = "rgb(255,255,136)";
	_g.fillRect(0, 0, _rc.width, 20);

	stage = new Kinetic.Stage({
		container : 'viewer',
		width : 800,
		height : 600,
		visible : true,
	});

	_usecaseGroup = new Kinetic.Group({
		x : 0,
		y : 0,
		draggable : true
	});

	var backRect = new Kinetic.Rect({
		x : 0,
		y : 0,
		width : _rc.width,
		height : _rc.height,
		opacity : 0
	});

	_lineRelationRect = new Kinetic.Rect({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		visible: false,
		fill: "lightyellow",
		opacity: 0.4
	});

	_lineRelationRect.isInside = function(p){
		var _p = this.getAbsolutePosition();
		var w  = this.getWidth();
		var h  = this.getHeight();
		var l  = w>0? _p.x: _p.x + w;
		var r  = l + Math.abs(w);
		var t  = h>0? _p.y: _p.y + h;
		var b  = t + Math.abs(t);
		
		var c =	p.x > l && p.x < r && p.y > t && p.y < b;

		return c;
	};


//	stage.on('dbltap', function(event) {
//		_usingGestures = false;
//		event.preventDefault();
//		$("#scroller").css("z-index", "12");
//	});
	
	stage.on("touchstart mousedown", onGroupTouchStart);
	stage.on("touchmove mousemove", onGroupTouchMove);
	stage.on("touchend mouseup", onGroupTouchEnd);

//	backRect.on('touchstart mousedown', onStageTouchStart);
//	backRect.on('touchmove mousemove', onStageTouchMove);
//	backRect.on('touchend mouseup', onStageTouchEnd);

	var backRectLayer = new Kinetic.Layer();
	backRectLayer.add(backRect);
	stage.add(backRectLayer);

	var scroller = document.getElementById("scroller");
	scroller.addEventListener("dblclick", scrollerDown, false);
	scroller.addEventListener("touchstart", scrollerTouchStart, false);
	scroller.addEventListener("touchmove", scrollerTouchMove, false);
	scroller.addEventListener("touchend", scrollerDown, false);

	function scrollerTouchStart(event) {
		_scrollerWannaDown = true;
	}

	function scrollerTouchMove(event) {
		_scrollerWannaDown = false;
	}

	function scrollerDown(event) {
		if (_scrollerWannaDown) {
			event.preventDefault();
			$("#status").html("tapped scroller");
			$("#scroller").css("z-index", "-4");
			_scrollerWannaDown = true;
		}
	}

	// Layer
	usecaseSBYLayer = new Kinetic.Layer();
	usecaseEntityLayer = new Kinetic.Layer();
	usecaseLineLayer = new Kinetic.Layer();
	stage.add(usecaseSBYLayer);
	stage.add(usecaseLineLayer);
	stage.add(usecaseEntityLayer);

	classPakageLayer = new Kinetic.Layer();
	classEntityLayer = new Kinetic.Layer();
	classLineLayer = new Kinetic.Layer();
	stage.add(classPakageLayer);
	stage.add(classLineLayer);
	stage.add(classEntityLayer);

	_gesLayer = new Kinetic.Layer();
	stage.add(_gesLayer);
	classLineLayer.add(_lineRelationRect);

	_class.push(_lineRelationRect);

	_isDown = false;

	// Initialize Arrays
	initArrays();
	for ( var i = 0; i < _classLayers.length; i++) {
		_classLayers[i].hide();
	}
	_curStage = 0;
}

// getCanvasRect
function getCanvasRect(canvas) {
	var w = canvas.width;
	var h = canvas.height;

	var cx = canvas.offsetLeft;
	var cy = canvas.offsetTop;
	while (canvas.offsetParent != null) {
		canvas = canvas.offsetParent;
		cx += canvas.offsetLeft;
		cy += canvas.offsetTop;
	}
	return {
		x : cx,
		y : cy,
		width : w,
		height : h
	};
}
function getScrollY() {
	var scrollY = 0;
	scrollY = window.pageYOffset; // FF
	return scrollY;
}
//
// Checkbox option for using limited rotation invariance requires rebuilding the
// recognizer.
//
function confirmRebuild() {
	if (confirm("Changing this option will discard any user-defined gestures you may have made.")) {
		_r = new NDollarRecognizer(document
				.getElementById('useBoundedRotationInvariance').checked);
	} else {
		var chk = document.getElementById('useBoundedRotationInvariance');
		chk.checked = !chk.checked; // undo click
	}
}

function drawConnectedPoint(from, to) {
	_g.beginPath();
	_g.moveTo(_points[from].X, _points[from].Y);
	_g.lineTo(_points[to].X, _points[to].Y);
	_g.closePath();
	_g.stroke();
}

function drawConnectedGesturePoint() {
	if (_gesPoints.length < 2)
		return;
	var length = _gesPoints.length;
	var l = new Kinetic.Line({
		points : [ _gesPoints[length - 2].X, _gesPoints[length - 2].Y,
				_gesPoints[length - 1].X, _gesPoints[length - 1].Y ],
		stroke : 'black',
		strokeWidth : 1
	});

	_gesLines.push(l);
	_gesLayer.add(l);
	_gesLayer.draw();
}

function drawText(str) {
//	_g.fillStyle = "rgb(255,255,136)";
//	_g.fillRect(0, 0, _rc.width, 20);
//	_g.fillStyle = "rgb(0,0,255)";
//	_g.fillText(str, 1, 14);
	$("#status").html(str);
}
function rand(low, high) {
	return Math.floor((high - low + 1) * Math.random()) + low;
}
function round(n, d) // round 'n' to 'd' decimals
{
	d = Math.pow(10, d);
	return Math.round(n * d) / d;
}
//
// Multistroke Adding and Clearing
//
function onClickAddExisting() {
	if (_strokes.length > 0) {
		if (_strokes.length < 5
				|| confirm("With "
						+ _strokes.length
						+ " component strokes, it will take a few moments to add this gesture. Proceed?")) {
			var multistrokes = document.getElementById('multistrokes');
			var name = multistrokes[multistrokes.selectedIndex].value;
			var num = _r.AddGesture(name, document
					.getElementById('useBoundedRotationInvariance').checked,
					_strokes);
			drawText("\"" + name + "\" added. Number of \"" + name
					+ "\"s defined: " + num + ".");
			_points.length = 0; // clear and signal to clear strokes on next
			// mousedown
		}
	}
}

// AddCustom
function onClickAddCustom() {
	var name = document.getElementById('custom').value;
	if (_strokes.length > 0 && name.length > 0) {
		if (_strokes.length < 5
				|| confirm("With "
						+ _strokes.length
						+ " component strokes, it will take a few moments to add this gesture. Proceed?")) {
			var num = _r.AddGesture(name, document
					.getElementById('useBoundedRotationInvariance').checked,
					_strokes);
			drawText("\"" + name + "\" added. Number of \"" + name
					+ "\"s defined: " + num + ".");
			_points.length = 0; // clear and signal to clear strokes on next
			// mousedown
		}
	}
}

// Custom
function onClickCustom() {
	document.getElementById('custom').select();
}

// Delete
function onClickDelete() {
	var num = _r.DeleteUserGestures(); // deletes any user-defined multistrokes
	alert("All user-defined gestures have been deleted. Only the 1 predefined gesture remains for each of the "
			+ num + " types.");
	_points.length = 0; // clear and signal to clear strokes on next mousedown
}

// ClearStrokes
function onClickClearStrokes() {
	_points.length = 0; // clear and signal to clear strokes on next mousedown
	_g.clearRect(0, 0, _rc.width, _rc.height);
	drawText("Canvas cleared.");
}

// buildGroup Start
function buildGroup(x, y) {
	var group = new Kinetic.Group({
		x : x,
		y : y,
//		draggable : true
	});

	group.elements = new Array();
	group.connectors = new Array();
	group.currentX = x;
	group.currentY = y;
	group.curContainer = null;
	group.connectedObjects = new Array();

	for ( var i = 2; i < arguments.length; i++) {
		group.add(arguments[i]);
		group.elements.push(arguments[i]);
		arguments[i].group = group;
	}
	// For test use
	group.divCounter = 0;

	group.isConnectedToThis = function(obj) {
		for ( var i = 0; i < this.connectedObjects.length; i++) {
			if (this.connectedObjects[i] == obj)
				return true;
		}
		return false;
	};

	group._getName = function() {
		return this.name.getText();
	};

	group.getClosestConnector = function(p) {
		var distance = infiniteDistance;
		var selectedConnector = null;
		for ( var i = 0; i < this.connectors.length; i++) {
			var t = this.connectors[i];
			var d = (t.x - p.x) * (t.x - p.x) + (t.y - p.y) * (t.y - p.y);
			if (d < distance) {
				distance = d;
				selectedConnector = t;
			}
		}
		return selectedConnector;
	};

	group.moveLines = function() {
		if (this.lines != undefined && this.lines != null) {
			for ( var i = 0; i < this.lines.length; i++) {
				var end = 0;
				if (this == this.lines[i].terminal)
					end = 1;
				var p = this.lines[i].getPoints();
				var connector = this.getClosestConnector({
					// p[1 - end] is the other end's point
					x : p[1 - end].x,
					y : p[1 - end].y
				});
				p[end] = connector;
				this.lines[i].setPoints(p);
				this.lines[i].refreshName();
			}
			this.lineLayer.draw();
		}
	};

	group.moveConnectors = function(movedX, movedY) {
		for ( var i = 0; i < this.connectors.length; i++) {
			var c = this.connectors[i];
			c.x += movedX;
			c.y += movedY;
		}
	};

	group.moveThis = function(movedX, movedY) {
		var x = this.getX();
		var y = this.getY();
		this.currentX += movedX;
		this.currentY += movedY;
		this.setX(x + movedX);
		this.setY(y + movedY);
		this.moveConnectors(movedX, movedY);
		this.moveLines();
	};
	
	group.curEvent = {
		longPress: false,
		startTime: 0,
		tappedDown: false,
		startPoint: {
			x:0,
			y:0
		},
		curPoint: {
			x:0,
			y:0
		},
		startType: "oneDrag",
		touchId:0
	};
	
//	group.on("touchstart mousedown", onGroupTouchStart);
//	group.on("touchmove mousemove", onGroupTouchMove);
//	group.on("touchend mouseup", onGroupTouchEnd);

//	group.on('dragstart', function() {
//		_usingGestures = false;
//		_wannaConn = false;
//		this.pointer.setStrokeWidth(1);
//		if (this.type == 'Class') {
//			this.hideComponents();
//			this.hideTouchDeleters();
//		}
//	});
//
//	group.on('dragmove', function() {
//		_usingGestures = false;
//		var p = this.getAbsolutePosition();
//		var x = p.x;
//		var y = p.y;
//		var movedX = x - this.currentX;
//		var movedY = y - this.currentY;
//		this.currentX = x;
//		this.currentY = y;
//
//		this.moveConnectors(movedX, movedY);
//		this.moveLines();
//	});
//
//	group.on('dragend', function() {
//		_usingGestures = false;
//		var x = this.currentX;
//		var y = this.currentY;
//		var curContainer = null;
//		var containerArray = _sysBdry;
//		if (this.type == 'Class')
//			containerArray = _pakage;
//		for ( var i = 0; i < containerArray.length; i++) {
//			var con = containerArray[i];
//			if (con.isInside(x, y))
//				curContainer = con;
//		}
//		if (curContainer != null) {
//			if (this.curContainer != null)
//				this.curContainer.popContent(this);
//			curContainer.pushContent(this);
//			this.curContainer = curContainer;
//			$('#status')
//					.html(
//							'Current Container = '
//									+ curContainer.elements[1].getText());
//		} else {
//			if (this.curContainer != null)
//				this.curContainer.popContent(this);
//			this.curContainer = null;
//			$('#status').html('Current Container = null');
//		}
//	});

	return group;
}
// buildGroup END

function buildUser(x, y, labelText, id) {
	var head = new Kinetic.Circle({
		x : 0,
		y : 0,
		radius : 20,
		fill : 'lightblue',
		stroke : 'black',
		strokeWidth : 1,
		lineJoin : 'round',
		lineCap : 'round'
	});

	var name = new Kinetic.Text(
			{
				x : -10,
				y : 95,
				text : labelText == undefined ? 'User' + _usecase._lastId++
						: labelText,
				fontSize : 10,
				fontFamily : 'Calibri',
				fill : 'black'
			});

	name.type = 'name';
	name.currentX = name.getX();
	name.currentY = name.getY();

	name.on('mousedown tap', function() {
		_usingGestures = false;
		var p = this.getAbsolutePosition();
		$('#labelContent').css('left', (p.x).toString() + 'px');
		$('#labelContent').css('top', (p.y).toString() + 'px');
		$('#labelContent').val(this.getText());
		$('#labelContent').css('width',
				(this.getWidth() + 20).toString() + 'px');
		$('#labelContent').css('visibility', 'visible');
		$('#labelEditor').css('z-index', '12');
		labelContentCaller = this;
	});

	var stem = new Kinetic.Line({
		points : [ 0, 0, 0, 50 ],
		stroke : 'black',
		strokeWidth : 2,
		lineCap : 'round',
		lineJoin : 'round'
	});

	var arm1 = new Kinetic.Line({
		points : [ 0, 30, -25, 40 ],
		stroke : 'black',
		strokeWidth : 2,
		lineCap : 'round',
		lineJoin : 'round'
	});

	var arm2 = new Kinetic.Line({
		points : [ 0, 30, 25, 40 ],
		stroke : 'black',
		strokeWidth : 2,
		lineCap : 'round',
		lineJoin : 'round'
	});

	var leg1 = new Kinetic.Line({
		points : [ 0, 50, -25, 90 ],
		stroke : 'black',
		strokeWidth : 2,
		lineCap : 'round',
		lineJoin : 'round'
	});

	var leg2 = new Kinetic.Line({
		points : [ 0, 50, 25, 90 ],
		stroke : 'black',
		strokeWidth : 2,
		lineCap : 'round',
		lineJoin : 'round'
	});

	var group = new Kinetic.Group({
		x : x,
		y : y,
		draggable : true,
		shadowColor : 'black',
		shadowBlur : 10,
		shadowOffset : [ 4, 4 ],
		shadowOpacity : 0.2
	});

	var pointer = new Kinetic.Circle({
		x : 25,
		y : -18,
		radius : 5,
		fill : 'lightblue',
		stroke : 'black',
		strokeWidth : 1,
		lineJoin : 'round',
		lineCap : 'round',
	});

	pointer.group = group;
	name.group = group;
	head.group = group;
	pointer.connector = null;
	pointer.originalX = x + 25;
	pointer.originalY = y - 18;

	pointer.on('mouseover', function() {
		_usingGestures = false;
		document.body.style.cursor = 'pointer';
		this.setStrokeWidth(2);
		usecaseEntityLayer.draw();
	});

	pointer.on('mouseout', function() {
		_usingGestures = false;
		document.body.style.cursor = 'default';
		this.setStrokeWidth(1);
		usecaseEntityLayer.draw();
	});

	pointer.on('mousedown tap', function() {
		_usingGestures = false;
		if (_wannaConn && _curConnUser != null)
			_curConnUser.pointer.setFill('lightblue');
		this.setFill('red');
		_curConnUser = this.group;
		_wannaConn = true;
		usecaseEntityLayer.draw();
	});

	group.type = 'User';
	group.name = name;
	group.contentColor = 'lightblue';
	group.divCounter = 0;
	group.pointer = head;
	group.originalX = x;
	group.originalY = y;
	group.currentX = x;
	group.currentY = y;
	group.lines = new Array();
	group.connectors = new Array();
	group.connectedObjects = new Array();

	// Add connectors
	// Anticlockwise
	group.connectors.push({
		x : x,
		y : y - 24
	});
	group.connectors.push({
		x : x + 25,
		y : y + 40
	});
	group.connectors.push({
		x : x + 25,
		y : y + 90
	});
	group.connectors.push({
		x : x - 25,
		y : y + 90
	});
	group.connectors.push({
		x : x - 25,
		y : y + 40
	});

	group.id = id == undefined ? _lastId++ : id;

	// group.add(backRect);
	// group.add(pointer);
	group.add(stem);
	group.add(arm1);
	group.add(arm2);
	group.add(leg1);
	group.add(leg2);
	group.add(head);
	group.add(name);

	group.elements = new Array();
	group.elements.push(head);
	group.elements.push(name);
	group.elements.push(arm1);
	group.elements.push(arm2);
	group.elements.push(stem);
	group.elements.push(leg1);
	group.elements.push(leg2);

	group.isConnectedToThis = function(obj) {
		for ( var i = 0; i < this.connectedObjects.length; i++) {
			if (this.connectedObjects[i] == obj)
				return true;
		}
		return false;
	};

	group._getName = function() {
		return this.name.getText();
	};

	group.moveLines = function() {
		if (this.lines != undefined && this.lines != null) {
			for ( var i = 0; i < this.lines.length; i++) {
				var end = 0;
				if (this == this.lines[i].terminal)
					end = 1;
				var p = this.lines[i].getPoints();
				var connector = this.getClosestConnector({
					// p[1 - end] is the other end's point
					x : p[1 - end].x,
					y : p[1 - end].y
				});
				// p[end].x += movedX;
				// p[end].y += movedY;
				p[end] = connector;
				this.lines[i].setPoints(p);
				this.lines[i].refreshName();
			}
			usecaseLineLayer.draw();
		}
	};

	group.getClosestConnector = function(p) {
		var distance = infiniteDistance;
		var selectedConnector = null;
		for ( var i = 0; i < this.connectors.length; i++) {
			var t = this.connectors[i];
			var d = (t.x - p.x) * (t.x - p.x) + (t.y - p.y) * (t.y - p.y);
			if (d < distance) {
				distance = d;
				selectedConnector = t;
			}
		}
		return selectedConnector;
	};

	group.moveConnectors = function(movedX, movedY) {
		for ( var i = 0; i < this.connectors.length; i++) {
			var c = this.connectors[i];
			c.x += movedX;
			c.y += movedY;
		}
	};

	group.moveThis = function(movedX, movedY) {
		var x = this.getX();
		var y = this.getY();
		this.currentX += movedX;
		this.currentY += movedY;
		this.setX(x + movedX);
		this.setY(y + movedY);
		this.moveConnectors(movedX, movedY);
		this.moveLines();
	};

	head.on('mousedown touchstart', function() {
		_usingGestures = false;
		if (_wannaConn && _curConnUser != null) {
			_curConnUser.pointer.setStrokeWidth(1);
			if (_curConnUser == this.group) {
				_wannaConn = false;
				return;
			}
		}
		this.setStrokeWidth(4);
		_curConnUser = this.group;
		_wannaConn = true;
		usecaseEntityLayer.draw();
		// this.group.deleteThis();
	});

	group.on('dragstart', function() {
		_usingGestures = false;
		_wannaConn = false;
		this.pointer.setStrokeWidth(1);
	});

	group.on('dragmove', function() {
		_usingGestures = false;
		var p = this.getAbsolutePosition();
		var x = p.x;
		var y = p.y;
		var movedX = x - this.currentX;
		var movedY = y - this.currentY;
		this.currentX = x;
		this.currentY = y;

		this.moveConnectors(movedX, movedY);
		this.moveLines();
	});
	
	group.on("mousemove", onGroupTouchMove);

	// group.on('dragend',function(){
	// this.deleteThis();
	// });

	group.isInside = function(p) {
		var gp = this.getAbsolutePosition();
		var b1 = (p.x > gp.x - 20);
		var b2 = (p.x < gp.x + 20);
		var b3 = (p.y > gp.y - 20);
		var b4 = (p.y < gp.y + 90);
		return b1 && b2 && b3 && b4;
	};

	group.deleteThis = function() {
		_wannaConn = false;
		_curConnUser = null;

		for ( var i = 0; i < this.lines.length; i++) {
			var line = this.lines[i];
			var o = this == line.source ? line.terminal : line.source;
			removeFromArray(o.connectedObjects, this);
			removeFromArray(o.lines, line);
			removeFromArray(_line, line);
			line.deleteThis();
		}

		for ( var i = 0; i < this.elements.length; i++) {
			var o = this.elements[i];
			o.remove();
			o.destroy();
		}

		removeFromArray(_user, this);
		
		var sta = _store.remove(this.id.toString());
		drawText("Deleting " + this.id.toString() + ":" + this.type + " result=" + sta);

		this.remove();
		this.destroy();

		drawLayers();
	};
	
	group.curEvent = {
			longPress: false,
			startTime: 0,
			startPoint: {
				x:0,
				y:0
			},
			startType: "oneTouch"
		};

	usecaseEntityLayer.add(group);
	usecaseEntityLayer.draw();

	_user.push(group);

	putIntoTree(group);

	return group;
}

// buildUseCase Start

function buildUseCase(x, y, labelText, id) {
	// Ellipse
	var useCase = new Kinetic.Ellipse({
		x : 0,
		y : 0,
		radius : {
			x : 150,
			y : 150
		},
		fill : 'lightyellow',
		stroke : 'black',
		strokeWidth : 1,
		lineJoin : 'round',
		lineCap : 'round',
		width : 100,
		height : 50,
		shadowColor : 'black',
		shadowBlur : 10,
		shadowOffset : [ 4, 4 ],
		shadowOpacity : 0.2
	});

	var useCaseText = new Kinetic.Text({
		x : useCase.getX() - 10,
		y : useCase.getY() - 10,
		text : labelText == undefined ? 'Usecase' + _usecase._lastId++
				: labelText,
		fontSize : 10,
		fontFamily : 'Calibri',
		fill : 'black'
	});

	var pointer = new Kinetic.Circle({
		x : 50,
		y : -25,
		radius : 5,
		fill : 'lightblue',
		stroke : 'black',
		strokeWidth : 1,
		lineJoin : 'round',
		lineCap : 'round',
	});

	pointer.on('mouseover', function() {
		_usingGestures = false;
		document.body.style.cursor = 'pointer';
		this.setStrokeWidth(2);
		usecaseEntityLayer.draw();
	});

	pointer.on('mouseout', function() {
		_usingGestures = false;
		document.body.style.cursor = 'default';
		this.setStrokeWidth(1);
		usecaseEntityLayer.draw();
	});

	pointer.on('mousedown tap', function() {
		_usingGestures = false;
		if (_wannaConn && _curConnUser != null) {
			_curConnUser.pointer.setFill('lightblue');
			if (_curConnUser == this.group) {
				_wannaConn = false;
				_curConnUser = null;
				return;
			}
		}
		this.setFill('red');
		_curConnUser = this.group;
		_wannaConn = true;
		usecaseEntityLayer.draw();
	});

	useCaseText.type = 'name';
	useCaseText.currentX = useCaseText.getX();
	useCaseText.currentY = useCaseText.getY();
	useCaseText.on('mousedown tap', function() {
		_usingGestures = false;
		var p = this.getAbsolutePosition();
		$('#labelContent').css('left', (p.x - 15).toString() + 'px');
		$('#labelContent').css('top', (p.y - 10).toString() + 'px');
		$('#labelContent').css('width',
				(this.getWidth() + 20).toString() + 'px');
		$('#labelContent').val(this.getText());
		$('#labelContent').css('visibility', 'visible');
		$('#labelEditor').css('z-index', '12');
		labelContentCaller = this;
	});

	// add hover styling
	useCase.on('mouseover', function() {
		_usingGestures = false;
		document.body.style.cursor = 'pointer';
		this.setStrokeWidth(2);
		usecaseEntityLayer.draw();
	});

	useCase.on('mousedown touchstart', function() {
		_usingGestures = false;
		if (_wannaConn && _curConnUser != this.group) {
			_wannaConn = false;
			var source = _curConnUser;
			_curConnUser = null;
			source.pointer.setStrokeWidth(1);
			if (!this.group.isConnectedToThis(source)) {
				var s = "include";
				if (source.type == "User")
					s = "";
				var sourcePoint = source.getClosestConnector({
					x : this.group.currentX,
					y : this.group.currentY
				});
				var terminalPoint = this.group.getClosestConnector({
					x : source.currentX,
					y : source.currentY
				});
				drawLine(sourcePoint.x, sourcePoint.y, terminalPoint.x,
						terminalPoint.y, source, this.group, usecaseLineLayer,
						s);
				this.group.connectedObjects.push(source);
				source.connectedObjects.push(this.group);
			}
		} else if (_wannaConn && _curConnUser == this.group) {
			_wannaConn = false;
			this.setStrokeWidth(1);
		} else {
			if (_curConnUser != null) {
				_curConnUser.pointer.setStrokeWidth(1);
			}
			this.setStrokeWidth(2);
			_curConnUser = this.group;
			_wannaConn = true;
		}
		usecaseEntityLayer.draw();
	});

	useCase.on('mouseout', function() {
		_usingGestures = false;
		document.body.style.cursor = 'default';
		this.setStrokeWidth(1);
		usecaseEntityLayer.draw();
	});

	var group = buildGroup(x, y, useCase, useCaseText);
	group.lines = new Array();
	group.lineLayer = usecaseLineLayer;
	group.pointer = useCase;
	group.type = "Usecase";
	group.name = useCaseText;
	group.contentColor = 'lightyellow';
	group.id = id == undefined ? _lastId++ : id;

	// Add connectors
	// Top
	group.connectors.push({
		x : group.currentX,
		y : group.currentY - (useCase.getHeight() >> 1)
	});
	// Right
	group.connectors.push({
		x : group.currentX + (useCase.getWidth() >> 1),
		y : group.currentY
	});
	// Bottom
	group.connectors.push({
		x : group.currentX,
		y : group.currentY + (useCase.getHeight() >> 1)
	});
	// Left
	group.connectors.push({
		x : group.currentX - (useCase.getWidth() >> 1),
		y : group.currentY
	});

	group.isInside = function(p) {
		var gp = this.getAbsolutePosition();
		var b1 = (p.x > gp.x - 50);
		var b2 = (p.x < gp.x + 50);
		var b3 = (p.y > gp.y - 25);
		var b4 = (p.y < gp.y + 25);
		return b1 && b2 && b3 && b4;
		// return (p.x > gp.x - 50) && (p.x < gp.x + 50) && (p.y > gp.y - 25)
		// && (p.y < gp.y + 25);
	};

	group.deleteThis = function() {
		_wannaConn = false;
		_curConnUser = null;

		for ( var i = 0; i < this.lines.length; i++) {
			var line = this.lines[i];
			var o = this == line.source ? line.terminal : line.source;
			removeFromArray(o.connectedObjects, this);
			removeFromArray(o.lines, line);
			removeFromArray(_line, line);
			line.deleteThis();
		}

		for ( var i = 0; i < this.elements.length; i++) {
			var o = this.elements[i];
			o.remove();
			o.destroy();
		}

		if (!this.curContainer == null)
			removeFromArray(this.curContainer.contents, this);
		removeFromArray(_usecase, this);
		
		var sta = _store.remove(this.id.toString());
		drawText("Deleting " + this.id.toString() + ":" + this.type + " result=" + sta);

		this.remove();
		this.destroy();

		drawLayers();
	};

	// add the shape to the layer
	usecaseEntityLayer.add(group);
	usecaseEntityLayer.draw();

	_usecase.push(group);

	putIntoTree(group);

	return group;
}

// buildUseCase END

// buildClass Starts
function buildClass(x, y, labelText, id, width, height) {
	var wid, hei;
	if (arguments.length < 5) {
		wid = 150;
		hei = 90;
	} else {
		wid = width;
		hei = height;
	}

	var classRect = new Kinetic.Rect({
		x : 0,
		y : 0,
		stroke : 'black',
		strokeWidth : 1,
		fill : 'white',
		width : wid,
		height : hei,
		shadowColor : 'black',
		shadowBlur : 10,
		shadowOffset : [ 4, 4 ],
		shadowOpacity : 0.2
	});

	var className = new Kinetic.Text({
		x : 25,
		y : -10,
		text : labelText == undefined ? 'Class' + _class._lastId++ : labelText,
		fontSize : 16,
		fontFamily : 'Calibri',
		fill : '#555',
		padding : 20,
		align : 'center'
	});

	className.type = 'name';
	className.currentX = className.getX();
	className.currentY = className.getY();

	var hLine1 = new Kinetic.Line({
		points : [ 1, 30, wid - 1, 30 ],
		stroke : 'black',
		strokeWidth : 1
	});

	var hLine2 = new Kinetic.Line({
		points : [ 1, 55, wid - 1, 55 ],
		stroke : 'black',
		strokeWidth : 1
	});

	var pointer = new Kinetic.Circle({
		x : wid - 5,
		y : 5,
		radius : 5,
		fill : 'lightblue',
		stroke : 'black',
		strokeWidth : 1,
		lineJoin : 'round',
		lineCap : 'round',
		shadowColor : 'black',
		shadowBlur : 10,
		shadowOffset : [ 4, 4 ],
		shadowOpacity : 0.2
	});

	pointer.hide();

	var attrAdder = new Kinetic.Circle({
		x : 0,
		y : 0,
		radius : 5,
		fill : 'white',
		stroke : 'black',
		strokeWidth : 1,
		lineJoin : 'round',
		lineCap : 'round',
		shadowColor : 'black',
		shadowBlur : 10,
		shadowOffset : [ 4, 4 ],
		shadowOpacity : 0.2
	});

	var attrAdderLine1 = new Kinetic.Line({
		points : [ -4, 0, 4, 0 ],
		stroke : 'black',
		strokeWidth : 1,
		listening : false
	});
	var attrAdderLine2 = new Kinetic.Line({
		points : [ 0, -4, 0, 4 ],
		stroke : 'black',
		strokeWidth : 1,
		listening : false
	});

	var attrAdderGroup = new Kinetic.Group({
		x : 15,
		y : 47
	});

	attrAdderGroup.add(attrAdder);
	attrAdderGroup.add(attrAdderLine1);
	attrAdderGroup.add(attrAdderLine2);
	attrAdderGroup.dontHide = false;
	attrAdderGroup.hide();

	var methAdder = new Kinetic.Circle({
		x : 0,
		y : 0,
		radius : 5,
		fill : 'white',
		stroke : 'black',
		strokeWidth : 1,
		lineJoin : 'round',
		lineCap : 'round',
		shadowColor : 'black',
		shadowBlur : 10,
		shadowOffset : [ 4, 4 ],
		shadowOpacity : 0.2
	});

	var methAdderLine1 = new Kinetic.Line({
		points : [ -4, 0, 4, 0 ],
		stroke : 'black',
		strokeWidth : 1,
		listening : false
	});
	var methAdderLine2 = new Kinetic.Line({
		points : [ 0, -4, 0, 4 ],
		stroke : 'black',
		strokeWidth : 1,
		listening : false
	});

	var methAdderGroup = new Kinetic.Group({
		x : 15,
		y : 73
	});

	methAdderGroup.add(methAdder);
	methAdderGroup.add(methAdderLine1);
	methAdderGroup.add(methAdderLine2);
	methAdderGroup.dontHide = false;
	methAdderGroup.hide();

	var sizeRect = new Kinetic.Rect({
		x : classRect.getWidth() - 15,
		y : classRect.getHeight() - 15,
		stroke : 'black',
		strokeWidth : 1,
		fill : 'white',
		width : 15,
		height : 15,
		draggable : true,
		dragOnTop : false,
		dragBoundFunc : function(pos) {
			var p = this.group.getAbsolutePosition();
			var curXB = p.x + this.group.leastWidth - 15;
			var curYB = p.y + this.group.leastHeight - 15;
			if (pos.x < curXB)
				pos.x = curXB;
			if (pos.y < curYB)
				pos.y = curYB;
			return pos;
		}
	});

	sizeRect.hide();

	var attrDeleter = new Kinetic.Group();
	var adRect = new Kinetic.Rect({
		stroke : 'black',
		strokeWidth : 1,
		fill : 'white',
		width : 7,
		height : 7
	});
	var adLine1 = new Kinetic.Line({
		points : [ 1, 1, 6, 6 ],
		stroke : 'black',
		strokeWidth : 1,
		listening : false
	});
	var adLine2 = new Kinetic.Line({
		points : [ 6, 1, 1, 6 ],
		stroke : 'black',
		strokeWidth : 1,
		listening : false
	});
	attrDeleter.add(adRect);
	attrDeleter.add(adLine1);
	attrDeleter.add(adLine2);
	attrDeleter.rect = adRect;
	attrDeleter.curAttr = null;
	attrDeleter.dontShow = true;
	attrDeleter.hide();

	sizeRect.rect = classRect;
	sizeRect.hLine1 = hLine1;

	sizeRect.on('dragstart', function() {
		_usingGestures = false;
	});

	sizeRect.on('dragmove', function() {
		_usingGestures = false;
		var wid = this.getX() + this.getWidth();
		var hei = this.getY() + this.getHeight();
		if (wid < this.group.leastWidth)
			wid = this.group.leastWidth;
		if (hei < this.group.leastHeight)
			hei = this.group.leastHeight;

		this.group.rect.setWidth(wid);
		this.group.rect.setHeight(hei);

		var p = this.group.hLine1.getPoints();
		p[1].x = wid - 1;
		this.group.hLine1.setPoints(p);

		p = this.group.hLine2.getPoints();
		p[1].x = wid - 1;
		this.group.hLine2.setPoints(p);

		// var px = this.group.pointer.getX();
		// px = wid - 5;
		// this.group.pointer.setX(px);

		this.group.attrDeleter.setX(wid - 10);

		// refresh connectors of the class
		var c = this.group.connectors;
		var gp = this.group.getAbsolutePosition();
		c[0].x = gp.x + (wid >> 1);
		c[1].x = gp.x + wid;
		c[1].y = gp.y + (hei >> 1);
		c[2].x = gp.x + (wid >> 1);
		c[2].y = gp.y + hei;
		c[3].y = gp.y + (hei >> 1);
		this.group.moveLines();
		classLineLayer.draw();
	});

	className.on('mousedown tap', function() {
		_usingGestures = false;
		var p = this.getAbsolutePosition();
		var lc = $('#labelContent');
		var le = $('#labelEditor');
		lc.css('left', (p.x + 15).toString() + 'px');
		lc.css('top', (p.y + 15).toString() + 'px');
		lc.val(this.getText());
		lc.css('width', (this.getWidth()).toString() + 'px');
		lc.css('visibility', 'visible');
		le.css('z-index', '12');
		labelContentCaller = this;
	});

	attrAdder.on('mouseover', function() {
		_usingGestures = false;
		document.body.style.cursor = 'pointer';
		this.setStrokeWidth(2);
		classEntityLayer.draw();
	});

	attrAdder.on('mouseout', function() {
		_usingGestures = false;
		document.body.style.cursor = 'default';
		this.setStrokeWidth(1);
		classEntityLayer.draw();
	});
	attrDeleter.on('mouseover', function() {
		_usingGestures = false;
		document.body.style.cursor = 'pointer';
		this.rect.setStrokeWidth(2);
		classEntityLayer.draw();
	});

	attrDeleter.on('mouseout', function() {
		_usingGestures = false;
		document.body.style.cursor = 'default';
		this.rect.setStrokeWidth(1);
		classEntityLayer.draw();
	});

	attrDeleter.showThis = function() {
		// To make sure that the deleter won't appear after a null
		// attribute which might cause problems
		if (!this.dontShow
				&& (this.group.attributes.length > 0 || this.group.methods.length > 0)) {
			this.show();
		}
		if (this.curAttr == null || this.curAttr == undefined) {
			this.hide();
		}
	};

	var deleteAttr = function() {
		_usingGestures = false;
		// When the deleter is pressed, delete the corresponding attribute,
		// rearrange positions of each attribute and method,
		// resize the class rect and then refresh the connectors
		// as well as the lines connected to the class

		// Judge the type of the label and delete it
		var curAttr = this.curAttr;
		var attrSet = null;
		// Find the correct array that stores the attribute/method
		if (curAttr.type == 'attribute')
			attrSet = this.group.attributes;
		else
			attrSet = this.group.methods;

		var j = removeFromArray(attrSet, curAttr);

		// Remove the label and its rect from the layer
		if (curAttr.touchDeleter != null) {
			removeFromArray(this.group.touchDeleters, curAttr.touchDeleter);
			curAttr.touchDeleter.remove();
			curAttr.touchDeleter.destroy();
		}
		curAttr.rect.remove();
		curAttr.rect.destroy();
		curAttr.remove();
		curAttr.destroy();

		// Resize the rect and refresh other elements
		this.group.rect.setHeight(this.group.rect.getHeight() - 20);
		this.group.leastHeight -= 20;
		this.group.lastMethY -= 20;
		this.group.methAdderGroup.setY(this.group.methAdderGroup.getY() - 20);
		this.group.sizeRect.setY(this.group.sizeRect.getY() - 20);
		if (curAttr.type == 'attribute') {
			// If we are deleting an attribute, we need to refresh the
			// attributes behind the current deleting one, as well as all the
			// method labels and hLine2 of the class rect.
			this.group.lastAttrY -= 20;
			for ( var k = j; k < this.group.attributes.length; k++) {
				var at = this.group.attributes[k];
				at.setY(at.getY() - 20);
				at.rect.setY(at.rect.getY() - 20);
				if (at.touchDeleter != null)
					at.touchDeleter.setY(at.touchDeleter.getY() - 20);
			}
			for ( var k = 0; k < this.group.methods.length; k++) {
				var at = this.group.methods[k];
				at.setY(at.getY() - 20);
				at.rect.setY(at.rect.getY() - 20);
				if (at.touchDeleter != null)
					at.touchDeleter.setY(at.touchDeleter.getY() - 20);
			}
			this.group.attrAdderGroup
					.setY(this.group.attrAdderGroup.getY() - 20);
			var p = this.group.hLine2.getPoints();
			p[0].y -= 20;
			p[1].y -= 20;
			this.group.hLine2.setPoints(p);
		} else {
			// If we are deleting a method, we need to refresh the
			// methods behind the current deleting one
			for ( var k = j; k < this.group.methods.length; k++) {
				var at = this.group.methods[k];
				at.setY(at.getY() - 20);
				at.rect.setY(at.rect.getY() - 20);
				if (at.touchDeleter != null)
					at.touchDeleter.setY(at.touchDeleter.getY() - 20);
			}
		}

		this.hide();

		// refresh connectors and lines
		var gy = this.group.getAbsolutePosition().y;
		var rectH_2 = this.group.rect.getHeight() >> 1;
		this.group.connectors[1].y = gy + rectH_2;
		this.group.connectors[2].y -= 20;
		this.group.connectors[3].y = gy + rectH_2;
		this.group.moveLines();
		this.curAttr = null;
		classEntityLayer.draw();
		classLineLayer.draw();
	};

	attrDeleter.on('mousedown', deleteAttr);

	methAdder.on('mouseover', function() {
		_usingGestures = false;
		document.body.style.cursor = 'pointer';
		this.setStrokeWidth(2);
		classEntityLayer.draw();
	});

	methAdder.on('mouseout', function() {
		_usingGestures = false;
		document.body.style.cursor = 'default';
		this.setStrokeWidth(1);
		classEntityLayer.draw();
	});

	attrAdder.on('mousedown touchstart', function() {
		_usingGestures = false;
		this.group.addAttr("attribute", false);
		this.group.showTouchDeleters();
	});

	methAdder.on('mousedown touchstart', function() {
		_usingGestures = false;
		this.group.addMeth("method", false);
		this.group.showTouchDeleters();
	});

	sizeRect.on('mouseover', function() {
		_usingGestures = false;
		document.body.style.cursor = 'pointer';
		this.setStrokeWidth(2);
		classEntityLayer.draw();
	});

	sizeRect.on('mouseout', function() {
		_usingGestures = false;
		document.body.style.cursor = 'default';
		this.setStrokeWidth(1);
		classEntityLayer.draw();
	});

	pointer.on('mouseover', function() {
		_usingGestures = false;
		document.body.style.cursor = 'pointer';
		this.setStrokeWidth(2);
		classEntityLayer.draw();
	});

	pointer.on('mouseout', function() {
		_usingGestures = false;
		document.body.style.cursor = 'default';
		this.setStrokeWidth(1);
		classEntityLayer.draw();
	});

	pointer.on('mousedown tap', function() {
		_usingGestures = false;
		// Request for connector to other objects by this class
		if (_wannaConn && _curConnUser != null) {
			_curConnUser.pointer.setFill('lightblue');
			if (_curConnUser == this.group) {
				_wannaConn = false;
				_curConnUser = null;
				return;
			}
		}
		this.setFill('red');
		_curConnUser = this.group;
		_wannaConn = true;
		classEntityLayer.draw();
	});

//	classRect.on('mousedown touchstart', function(event) {
//		_usingGestures = false;
//		// Check if there is other objects that wanna connect this
//		var eventtype = "touchstart";
//		if (_wannaConn && _curConnUser != this.group) {
//			_wannaConn = false;
//			var source = _curConnUser;
//			_curConnUser = null;
//			source.pointer.setStrokeWidth(1);
//			source.hideComponents();
//			source.hideTouchDeleters();
//			if (!this.group.isConnectedToThis(source)) {
//				var sCC = source.getClosestConnector(this.group
//						.getAbsolutePosition());
//				var tCC = this.group.getClosestConnector(source
//						.getAbsolutePosition());
//				drawLine(sCC.x, sCC.y, tCC.x, tCC.y, source, this.group,
//						classLineLayer, "");
//				this.group.connectedObjects.push(source);
//				source.connectedObjects.push(this.group);
//			}
//		} else if (_wannaConn && _curConnUser == this.group) {
//			_wannaConn = false;
//			this.setStrokeWidth(1);
//			if (event.type == eventtype) {
//				this.group.hideComponents();
//				this.group.hideTouchDeleters();
//			}
//		} else {
//			if (_curConnUser != null) {
//				_curConnUser.pointer.setStrokeWidth(1);
//				_curConnUser.hideComponents();
//				_curConnUser.hideTouchDeleters();
//			}
//			this.setStrokeWidth(2);
//			_curConnUser = this.group;
//			_wannaConn = true;
//			if (event.type == eventtype) {
//				this.group.showComponents();
//				this.group.showTouchDeleters();
//			}
//		}
//
//		classEntityLayer.draw();
//	});

	var group = buildGroup(x, y, classRect, className, hLine1, hLine2,
			attrAdderGroup, methAdderGroup, sizeRect, attrDeleter);

	group.showTouchDeleters = function() {
		for ( var i = 0; i < this.touchDeleters.length; i++) {
			this.touchDeleters[i].show();
		}
	};

	group.hideTouchDeleters = function() {
		for ( var i = 0; i < this.touchDeleters.length; i++) {
			this.touchDeleters[i].hide();
		}
	};

	group.buildTouchDeleter = function(x, y, attr) {
		var td = new Kinetic.Group({
			x : x,
			y : y
		});

		td.curAttr = attr;
		td.group = this;

		var rect = new Kinetic.Rect({
			width : 10,
			height : 10,
			x : 0,
			y : 0,
			fill : "white",
			stroke : 'black',
			strokeWidth : 1
		});

		rect.group = this;
		rect.curAttr = attr;

		var line1 = new Kinetic.Line({
			points : [ 1, 1, 9, 9 ],
			stroke : 'black',
			strokeWidth : 1,
			listening : false
		});

		var line2 = new Kinetic.Line({
			points : [ 9, 1, 1, 9 ],
			stroke : 'black',
			strokeWidth : 1,
			listening : false
		});

		td.add(rect);
		td.add(line1);
		td.add(line2);
		this.touchDeleters.push(td);
		this.add(td);
		td.hide();

		rect.on('mousedown touchstart', deleteAttr);

		return td;
	};

	group.showComponents = function() {
		this.attrAdderGroup.show();
		this.methAdderGroup.show();
		// this.pointer.show();
		this.sizeRect.show();
		this.rect.setStrokeWidth(2);
	};

	group.hideComponents = function() {
		this.attrAdderGroup.hide();
		this.methAdderGroup.hide();
		// this.pointer.hide();
		this.sizeRect.hide();
		this.rect.setStrokeWidth(1);
	};

	group.on('mouseover', function() {
		_usingGestures = false;
		// When the mouse flows over, show all the buttons
		this.showComponents();
		this.attrDeleter.showThis();
		document.body.style.cursor = 'pointer';
		classEntityLayer.draw();
	});

	group.on('mouseout', function() {
		_usingGestures = false;
		// When the mouse leaves, hide all the buttons
		this.hideComponents();
		this.attrDeleter.hide();
		document.body.style.cursor = 'default';
		classEntityLayer.draw();
	});

	// Used for reference in event handlers
	group.type = "Class";
	group.contentColor = 'white';
	group.name = className;
	group.lastAttrY = 25;
	group.lastMethY = group.lastAttrY + 25;
	group.attributes = new Array();
	group.methods = new Array();
	group.rect = classRect;
	group.attrAdderGroup = attrAdderGroup;
	group.methAdderGroup = methAdderGroup;
	group.pointer = classRect;
	group.sizeRect = sizeRect;
	group.hLine1 = hLine1;
	group.hLine2 = hLine2;
	group.attrDeleter = attrDeleter;
	group.lines = new Array();
	group.lineLayer = classLineLayer;
	group.id = id == undefined ? _lastId++ : id;
	group.leastHeight = hei;
	group.leastWidth = wid;
	group.touchDeleters = new Array();

	attrAdder.group = methAdder.group = group;

	// Add connectors
	// Top
	group.connectors.push({
		x : group.getX() + (classRect.getWidth() >> 1),
		y : group.getY()
	});
	// Right
	group.connectors.push({
		x : group.getX() + (classRect.getWidth()),
		y : group.getY() + (classRect.getHeight() >> 1)
	});
	// Bottom
	group.connectors.push({
		x : group.getX() + (classRect.getWidth() >> 1),
		y : group.getY() + (classRect.getHeight())
	});
	// Left
	group.connectors.push({
		x : group.getX(),
		y : group.getY() + (classRect.getHeight() >> 1)
	});

	// Methods owned by the Class Element
	group.getAttributes = function() {
		// Write attributes into XML
		var s = "";
		for ( var i = 0; i < this.attributes.length; i++) {
			s += "<attr value='" + this.attributes[i].getText() + "' />";
		}
		return s;
	};
	group.getMethods = function() {
		// Write methods into XML
		var s = "";
		for ( var i = 0; i < this.methods.length; i++) {
			s += "<meth value='" + this.methods[i].getText() + "' />";
		}
		return s;
	};
	group.addAttr = function(attr, designatedHeight) {
		// Add an attribute to the class:
		// 1. Create the text object for the attribute
		// 2. Create the hit box for the attribute
		// 3. Rearrange the positions of methods and other buttons
		// 4. Resize the rect
		// 5. Refresh connectors as well as the lines connected to the class

		var attrLabel = new Kinetic.Text({
			x : -10,
			y : this.lastAttrY,
			text : attr,
			fontSize : 12,
			fontFamily : 'Calibri',
			fill : 'black',
			padding : 20,
			listening : false
		});

		var attrLabelRect = new Kinetic.Rect({
			x : 0,
			y : attrLabel.getY() + 20,
			width : 20,
			height : 15,
			fill : 'lightyellow',
			stroke : 'black',
			opacity : 0
		});

		attrLabelRect.label = attrLabel;
		attrLabel.rect = attrLabelRect;

		attrLabelRect.group = this;
		attrLabel.group = this;

		attrLabelRect.touchDeleter = this.buildTouchDeleter(-20,
				this.lastAttrY + 20, attrLabel);
		attrLabel.touchDeleter = attrLabelRect.touchDeleter;

		attrLabelRect.on('mousedown tap', function() {
			_usingGestures = false;
			var p = this.getAbsolutePosition();
			$('#labelContent').css('left', (p.x).toString() + 'px');
			$('#labelContent').css('top', (p.y).toString() + 'px');
			$('#labelContent').val(this.label.getText());
			$('#labelContent').css('width',
					(this.label.getWidth()).toString() + 'px');
			$('#labelContent').css('visibility', 'visible');
			$('#labelEditor').css('z-index', '12');
			labelContentCaller = this.label;
		});

		attrLabelRect.on('mouseover', function() {
			_usingGestures = false;
			document.body.style.cursor = 'pointer';
			var deleter = this.group.attrDeleter;
			deleter.setX(this.group.rect.getWidth() - 10);
			deleter.setY(this.getY() + 5);
			deleter.curAttr = this.label;
			deleter.showThis();
			deleter.dontShow = false;
			classEntityLayer.draw();
		});

		attrLabelRect.on('mouseout', function() {
			_usingGestures = false;
			document.body.style.cursor = 'default';
		});

		attrLabel.type = 'attribute';
		attrLabel.setAttributeText = function(attr) {
			this.group.attributes[this.listIndex].setText(attr);
		};

		this.lastMethY += 20;
		this.lastAttrY += 20;
		this.methAdderGroup.setY(this.methAdderGroup.getY() + 20);
		this.attrAdderGroup.setY(this.attrAdderGroup.getY() + 20);
		var p = this.hLine2.getPoints();
		p[0].y += 20;
		p[1].y += 20;
		this.hLine2.setPoints(p);

		if (designatedHeight == false) {
			this.rect.setHeight(this.rect.getHeight() + 20);
			this.sizeRect.setY(this.sizeRect.getY() + 20);
			group.leastHeight += 20;

			// refresh y position of connectors of this class
			var p = this.getAbsolutePosition();
			this.connectors[1].y = p.y + ((this.rect.getHeight()) >> 1);
			this.connectors[2].y += 20;
			this.connectors[3].y = p.y + ((this.rect.getHeight()) >> 1);
			this.moveLines();
		}

		this.add(attrLabel);
		this.add(attrLabelRect);
		this.attributes.push(attrLabel);

		attrLabel.listIndex = this.attributes.length - 1;

		if (this.methods.length > 0) {
			for ( var i = 0; i < this.methods.length; i++) {
				var me = this.methods[i];
				me.setY(me.getY() + 20);
				me.rect.setY(me.rect.getY() + 20);
				if (me.touchDeleter != null)
					me.touchDeleter.setY(me.touchDeleter.getY() + 20);
			}
		}

		classEntityLayer.draw();
		classLineLayer.draw();
	};

	group.addMeth = function(meth, designatedHeight) {
		var methLabel = new Kinetic.Text({
			x : -10,
			y : this.lastMethY,
			text : meth,
			fontSize : 12,
			fontFamily : 'Calibri',
			fill : 'black',
			padding : 20,
			listening : false
		});

		var methLabelRect = new Kinetic.Rect({
			x : 0,
			y : methLabel.getY() + 20,
			width : 20,
			height : 15,
			fill : 'lightyellow',
			stroke : 'black',
			opacity : 0
		});

		methLabelRect.label = methLabel;
		methLabel.rect = methLabelRect;

		methLabelRect.group = this;
		methLabel.group = this;

		methLabelRect.touchDeleter = this.buildTouchDeleter(-20,
				this.lastMethY + 20, methLabel);
		methLabel.touchDeleter = methLabelRect.touchDeleter;

		methLabelRect.on('mousedown tap', function() {
			_usingGestures = false;
			var p = this.getAbsolutePosition();
			$('#labelContent').css('left', (p.x).toString() + 'px');
			$('#labelContent').css('top', (p.y).toString() + 'px');
			$('#labelContent').val(this.label.getText());
			$('#labelContent').css('width',
					(this.label.getWidth()).toString() + 'px');
			$('#labelContent').css('visibility', 'visible');
			$('#labelEditor').css('z-index', '12');
			labelContentCaller = this.label;
		});

		methLabelRect.on('mouseover', function() {
			_usingGestures = false;
			document.body.style.cursor = 'pointer';
			var deleter = this.group.attrDeleter;
			deleter.setX(this.group.rect.getWidth() - 10);
			deleter.setY(this.getY() + 5);
			deleter.curAttr = this.label;
			deleter.showThis();
			deleter.dontShow = false;
			classEntityLayer.draw();
		});

		methLabelRect.on('mouseout', function() {
			_usingGestures = false;
			document.body.style.cursor = 'default';
		});

		methLabel.type = 'method';
		methLabel.setMethodText = function(meth) {
			this.group.methods[this.listIndex].setText(meth);
		};

		this.lastMethY += 20;
		this.methAdderGroup.setY(this.methAdderGroup.getY() + 20);

		if (designatedHeight == false) {
			this.rect.setHeight(this.rect.getHeight() + 20);
			this.sizeRect.setY(this.sizeRect.getY() + 20);
			group.leastHeight += 20;

			// refresh y position of connectors of this class
			var p = this.getAbsolutePosition();
			this.connectors[1].y = p.y + ((this.rect.getHeight()) >> 1);
			this.connectors[2].y += 20;
			this.connectors[3].y = p.y + ((this.rect.getHeight()) >> 1);
			this.moveLines();
		}

		this.add(methLabel);
		this.add(methLabelRect);
		this.methods.push(methLabel);

		methLabel.listIndex = this.methods.length - 1;

		classEntityLayer.draw();
		classLineLayer.draw();
	};

	group.isInside = function(p) {
		var gp = this.getAbsolutePosition();
		return (p.x > gp.x) && (p.x < gp.x + this.rect.getWidth())
				&& (p.y > gp.y) && (p.y < gp.y + this.rect.getHeight());
	};

	group.deleteThis = function() {
		_wannaConn = false;
		_curConnUser = null;

		for ( var i = 0; i < this.lines.length; i++) {
			var line = this.lines[i];
			var o = this == line.source ? line.terminal : line.source;
			removeFromArray(o.connectedObjects, this);
			removeFromArray(o.lines, line);
			removeFromArray(_line, line);
			line.deleteThis();
		}

		for ( var i = 0; i < this.elements.length; i++) {
			var o = this.elements[i];
			o.remove();
			o.destroy();
		}

		removeFromArray(this.curContainer.contents, this);
		removeFromArray(_class, this);

		var sta = _store.remove(this.id.toString());
		drawText("Deleting " + this.id.toString() + ":" + this.type + " result=" + sta);
		
		this.remove();
		this.destroy();

		drawLayers();
	};

	classEntityLayer.add(group);
	classEntityLayer.draw();

	_class.push(group);

	putIntoTree(group);

	return group;
}
// build Class Ends
function getAContainer(x, y, labelText, curLabel, id, width, height, type) {
	// Build the graphic element of a container object
	// we have 2 kinds of container objects:
	// 1. System Boundary 2. Pakage
	var wid, hei;
	if (width == undefined) {
		wid = 300;
		hei = 300;
	} else {
		wid = width;
		hei = height;
	}
	var rect = new Kinetic.Rect({
		x : 0,
		y : 0,
		stroke : 'black',
		strokeWidth : 1,
		fill : 'white',
		width : wid,
		height : hei,
		shadowColor : 'black',
		shadowBlur : 10,
		shadowOffset : [ 4, 4 ],
		shadowOpacity : 0.2
	});

	var name = new Kinetic.Text({
		x : 0,
		y : 0,
		text : labelText == undefined ? 'SystemBoundary' : labelText,
		fontSize : 16,
		fontFamily : 'Calibri',
		fill : '#555',
		padding : 20,
		align : 'left'
	});

	name.type = 'name';
	name.currentX = name.getX();
	name.currentY = name.getY();
	name.on('mousedown tap', function() {
		_usingGestures = false;
		var p = this.getAbsolutePosition();
		$('#labelContent').css('left', (p.x).toString() + 'px');
		$('#labelContent').css('top', (p.y + 10).toString() + 'px');
		$('#labelContent').val(this.getText());
		$('#labelContent').css('width',
				(this.getWidth() + 20).toString() + 'px');
		$('#labelContent').css('visibility', 'visible');
		$('#labelEditor').css('z-index', '12');
		labelContentCaller = this;
	});

	var sizeRect = new Kinetic.Rect({
		x : rect.getWidth() - 15,
		y : rect.getHeight() - 15,
		stroke : 'black',
		strokeWidth : 1,
		fill : 'white',
		width : 15,
		height : 15,
		draggable : true,
		dragOnTop : false
	});

	sizeRect.rect = rect;

	sizeRect.on('dragstart', function() {
		_usingGestures = false;
	});

	sizeRect.on('dragmove', function() {
		_usingGestures = false;
		var wid = this.getX() + this.getWidth();
		var hei = this.getY() + this.getHeight();

		this.rect.setWidth(wid);
		this.rect.setHeight(hei);
		$('#status').html('sizeRect: ' + this.getX() + ', ' + this.getY());
	});

	sizeRect.on('mouseover', function() {
		_usingGestures = false;
		document.body.style.cursor = 'pointer';
		this.setStrokeWidth(2);
		curLabel.draw();
	});

	sizeRect.on('mouseout', function() {
		_usingGestures = false;
		document.body.style.cursor = 'default';
		this.setStrokeWidth(1);
		curLabel.draw();
	});

	var group = new Kinetic.Group({
		x : x,
		y : y,
		draggable : true,
		dragOnTop : false
	});

	group.on('mouseover', function() {
		document.body.style.cursor = 'pointer';
		this.rect.setStrokeWidth(2);
		this.curLabel.draw();
	});

	group.on('mouseout', function() {
		document.body.style.cursor = 'default';
		this.rect.setStrokeWidth(1);
		this.curLabel.draw();
	});

	rect.group = group;
	group.rect = rect;
	group.name = name;
	group.type = type;
	group.curLabel = curLabel;
	group.contents = new Array();
	group.id = id == undefined ? _lastId++ : id;
	group.add(rect);
	group.add(name);
	group.add(sizeRect);
	// Absolute position marker
	group.currentX = x;
	group.currentY = y;

	group.elements = new Array();
	group.elements.push(rect);
	group.elements.push(name);
	group.elements.push(sizeRect);
	group.pushContent = function(content) {
		// First check if there is already a content in the array
		// if not, push it
		var i;
		for (i = 0; i < this.contents.length; i++) {
			if (this.contents[i] == content)
				// Here we already have a content in the array
				return false;
		}
		// OK to push new content to the array
		this.contents.push(content);
		return true;
	};
	group.popContent = function(content) {
		// Pop the content from the array
		// And then rebuild the array from the popped-position
		var i;
		for (i = 0; i < this.contents.length; i++) {
			if (this.contents[i] == content) {
				for ( var j = i; j < this.contents.length - 1; j++)
					this.contents[j] = this.contents[j + 1];
				this.contents.length--;
				return true;
			}
		}
		return false;
	};
	group.isInside = function(x, y) {
		// Find out whether the given point (x,y) is inside this element
		return (x >= this.currentX && x <= this.currentX + this.rect.getWidth())
				&& (y >= this.currentY && y <= this.currentY
						+ this.rect.getHeight());
	};
	group.getContent = function() {
		// Give the XML segment of the contents of this container
		var s = "";
		for ( var i = 0; i < this.contents.length; i++) {
			s += "<cont id='" + this.contents[i].id + "' />";
		}
		return s;
	};

	group.on('dragmove', function() {
		_usingGestures = false;
		// When a container moves, we need refresh the position of the contents
		// as well as its lines and connectors
		var p = this.getAbsolutePosition();
		var contents = this.contents;
		var movedX = p.x - this.currentX;
		var movedY = p.y - this.currentY;
		this.currentX = p.x;
		this.currentY = p.y;
		for ( var i = 0; i < contents.length; i++) {
			contents[i].moveThis(movedX, movedY);
		}

		usecaseEntityLayer.draw();
		classEntityLayer.draw();
	});

	group.addContent = function(contId) {
		// Used for XML loading
		// get a content by its id
		for ( var i = 0; i < _objects.length; i++) {
			for ( var j = 0; j < _objects[i].length; j++) {
				var u = _objects[i][j];
				if (contId == u.id) {
					this.contents.push(u);
					u.curContainer = this;
					return true;
				}
			}
		}
		return false;
	};

	group.deleteThis = function() {
		_wannaConn = false;
		_curConnUser = null;

		for ( var i = 0; i < this.elements.length; i++) {
			var o = this.elements[i];
			o.remove();
			o.destroy();
		}

		var arr = this.type == 'SystemBoundary' ? _sysBdry : _pakage;
		removeFromArray(arr, this);

		var sta = _store.remove(this.id.toString());
		drawText("Deleting " + this.id.toString() + ":" + this.type + " result=" + sta);
		
		this.remove();
		this.destroy();

		drawLayers();
	};

	putIntoTree(group);

	return group;
}

function buildSystemBoundary(x, y, labelText, id, width, height) {
	labelText = labelText == undefined ? 'SystemBoundary' : labelText;
	var group = getAContainer(x, y, labelText, usecaseSBYLayer, id, width,
			height, 'SystemBoundary');

	usecaseSBYLayer.add(group);
	usecaseSBYLayer.draw();

	_sysBdry.push(group);

	return group;
}

function buildPakage(x, y, labelText, id, width, height) {
	labelText = labelText == undefined ? 'Pakage' : labelText;
	var group = getAContainer(x, y, labelText, classPakageLayer, id, width,
			height, 'Pakage');

	classPakageLayer.add(group);
	classPakageLayer.draw();

	_pakage.push(group);

	return group;
}

// Group Event Handlers
function onGroupTouchStart(event){
	event.preventDefault();
	if(event.type == "mousedown"){
		// Mouse event
		 
		var p = getPointOnCanvas({x: event.pageX, y: event.pageY});

		if(!_drawingLineHead){
			_tempObj = findEventFirer(p);
			var e = _tempObj.curEvent;
			e.startType = "oneDrag";
			e.curPoint = e.startPoint = p;
			e.longPress = true;
			e.tappedDown = true;
			
			// The implementation of long press func
			setTimeout("onGroupLongPress(_tempObj)", 1000);
		} else {
			_tempObj = findEventFirer(p);
			if(_tempObj == _lineRelationRect){
				var e = {
					longPress: false,
					startTime: event.timeStamp,
					curTime: event.timeStamp,
					tappedDown: true,
					startPoint: {
						x: p.x,
						y: p.y
					},
					curPoint: {
						x: p.x,
						y: p.y
					},
					startType: "drawLineHead",
					touchId:0
				};
				_tempObj.curEvent = e;
				_lineHeadPoints = new Array();
				_lineHeadPoints.push(p);
				_drawingLineHeadLine = new Kinetic.Line({
					points: _lineHeadPoints,
					stroke: 'green',
        			strokeWidth: 2,
        			lineJoin: 'round',
				});
				classLineLayer.add(_drawingLineHeadLine);
				classLineLayer.draw();

			} else {
				_tempObj = null;
				_drawingLineHead = false;
				_lineRelationRect.setVisible(false);
				classLineLayer.draw();
			}

		}
		
		// For debug use
		_console("touch start: {" + "startPoint: (" + event.layerX + "," + event.layerY + "), timestamp: "
				+ event.timeStamp + ", startType: " + e.startType + "}");
	}
	
	else if (event.type == "touchstart") {
		if(event.targetTouches.length > 1){
			var type = null;
			var multiOnOne = false;
			
			// Multi touches
			var objs = new Array();
			
			// Get the objects that are being touched
			for(var i = 0; i < event.targetTouches.length; i++){
				var _p = {
						x: event.targetTouches[i].pageX,
						y: event.targetTouches[i].pageY,
				};
				var p = getPointOnCanvas(_p);
				var o = findEventFirer(p);
				var _ac = arrayContains(objs, o);
				if(_ac)
					multiOnOne = true;
				if(o && !_ac)
					objs.push(o);
			}
			
			// Multi touches on one object
			if(objs.length == 1 && multiOnOne) {
				var p0 = {
						x: event.targetTouches[0].pageX,
						y: event.targetTouches[0].pageY
					};
				var p = getPointOnCanvas(p0);
				_tempObj = buildClass(p.x, p.y);
				_tempObj.addAttr('attr1: int', false);
				_tempObj.addAttr('attr2: String', false);
				_tempObj.addMeth('function1(): void', false);
				_tempObj.addMeth('function2(): void', false);
				
				var p1 = objs[0].getClosestConnector(p);
				var p2 = _tempObj.getClosestConnector(p1);
				drawLine(p2.x, p2.y, p1.x, p1.y, _tempObj, objs[0], classLineLayer, "");
				var e = _tempObj.curEvent;
				type = e.startType = "multiOnOne";
				e.startPoint = e.curPoint = p;
				objs[0].startPoint = objs[0].curPoint = p0;
				
				// No long press action when multi touches occur
				e.longPress = false;
				e.tappedDown = true;
				
			// Multi touches on different objects
			} else if(objs.length > 1){
				_tempObj = objs[0];
				_tempObj.list = objs;
				for(var i = 0; i < objs.length; i++){
					var p = {
							x: event.targetTouches[i].pageX,
							y: event.targetTouches[i].pageY,
					};
					p = getPointOnCanvas(p);
					var e = objs[i].curEvent;
					type = e.startType = "multiDrag";
					e.touchId = event.targetTouches[i].identifier;
					e.startPoint = e.curPoint = p;
					e.tappedDown = true;
					e.longPress = false;
				}
			}
			
			// For debug use
			_console("touch start: {touchType: " + type + ", touches: " + event.targetTouches.length + 
					", objects: " + objs.length + "}");
		} else {
			// Single touch
			
			var p = getPointOnCanvas({x: event.pageX, y: event.pageY});

			if(!_drawingLineHead){
				_tempObj = findEventFirer(p);
					var e = _tempObj.curEvent;
					e.startType = "oneDrag";
					e.curPoint = e.startPoint = p;
					e.longPress = true;
					e.tappedDown = true;
					
					// The implementation of long press func
					setTimeout("onGroupLongPress(_tempObj)", 1000);
			} else {
				_tempObj = findEventFirer(p);
				if(_tempObj == _lineRelationRect){
					var e = {
						longPress: false,
						startTime: event.timeStamp,
						curTime: event.timeStamp,
						tappedDown: true,
						startPoint: {
							x: p.x,
							y: p.y
						},
						curPoint: {
							x: p.x,
							y: p.y
						},
						startType: "drawLineHead",
						touchId:0
					};
					_tempObj.curEvent = e;
					_lineHeadPoints = new Array();
					_lineHeadPoints.push(p);
					_drawingLineHeadLine = new Kinetic.Line({
						points: _lineHeadPoints,
						stroke: 'green',
        				strokeWidth: 2,
        				lineJoin: 'round',
					});
					classLineLayer.add(_drawingLineHeadLine);
					classLineLayer.draw();
	
				} else {
					_tempObj = null;
					_drawingLineHead = false;
					_lineRelationRect.setVisible(false);
					classLineLayer.draw();
				}
			}
			
			// For debug use
			_console("touch start: {" + "startPoint: (" + e.curPoint.x + "," + e.curPoint.y + "), timestamp: "
					+ event.timeStamp + ", startType: " + e.startType + "}");
		}
	}
}

function onGroupTouchMove(event){
	event.preventDefault();
	if(!_tempObj) return;
	var e = _tempObj.curEvent;
	if(e.tappedDown){
		if(e.longPress) e.longPress = false;
		// Drag
		if(e.startType == "oneDrag"){
			// Mouse move or single touch
			
			var _p = {x: event.pageX, y: event.pageY};
			_p = getPointOnCanvas(_p);
			var movedX = _p.x - e.curPoint.x;
			var movedY = _p.y - e.curPoint.y;
			_tempObj.moveThis(movedX, movedY);
			usecaseEntityLayer.draw();
			classEntityLayer.draw();
			e.curPoint = _p;
		} else if(e.startType == "multiOnOne") {
			// Dragging the newly created class
			
			var _p = getPointOnCanvas({
				x: event.targetTouches[0].pageX,
				y: event.targetTouches[0].pageY
			});
			
			var movedX = _p.x - e.curPoint.x;
			var movedY = _p.y - e.curPoint.y;
			_tempObj.moveThis(movedX, movedY);
			usecaseEntityLayer.draw();
			classEntityLayer.draw();
			e.curPoint = _p;
		} else if(e.startType == "multiDrag") {
			var objs = _tempObj.list;
			
			for(var i = 0; i < objs.length; i++) {
				e = objs[i].curEvent;
				
				var touch = null;
				
				for(var j = 0; j < event.targetTouches.length; j++){
					touch = event.targetTouches[j];
					if(touch.identifier == e.touchId)
						break;
				}
				
				var _p = getPointOnCanvas({
					x: touch.pageX,
					y: touch.pageY
				});
				
				var movedX = _p.x - e.curPoint.x;
				var movedY = _p.y - e.curPoint.y;
				objs[i].moveThis(movedX, movedY);
				
				e.curPoint = _p;
			};
			usecaseEntityLayer.draw();
			classEntityLayer.draw();
		} else if(e.startType == "longPressDrawRelation"){
			var tp = {x: event.pageX, y: event.pageY};
			tp = getPointOnCanvas(tp);
			var sp = _tempObj.source.getClosestConnector(tp);
			var points = _tempObj.getPoints();
			points[0] = sp;
			points[1] = tp;
			classLineLayer.draw();
		} else if(e.startType == "drawLineHead"){
			var _p = getPointOnCanvas({x: event.pageX, y: event.pageY});
			if(_lineRelationRect.isInside(_p)){
				_lineHeadPoints.push(_p);
				_drawingLineHeadLine.setPoints(_lineHeadPoints);
				classLineLayer.draw();
			}
		}
	}
}

function onGroupTouchEnd(event){
	if(!_tempObj) return;
	var e = _tempObj.curEvent;
	if(e.tappedDown){
		e.tappedDown = false;
		if(e.startType == "longPressDrawRelation"){
			if(e.longPress) e.longPress = false;
			var cp = {x: event.pageX, y: event.pageY};
			cp = getPointOnCanvas(cp);
			var tobj = findEventFirer(cp);
			if(tobj != null){
				var sobj = _tempObj.source;
				var sp = sobj.getClosestConnector(cp);
				var tp = tobj.getClosestConnector(sp);
				_tempObj.remove();
				_lineRelationRect.line = drawLine(sp.x, sp.y, cp.x, cp.y, sobj, tobj, classLineLayer, "");
				_lineRelationRect.setAbsolutePosition(sp);
				_lineRelationRect.setWidth(tp.x - sp.x);
				_lineRelationRect.setHeight(tp.y - sp.y);
				_lineRelationRect.setVisible(true);

				classLineLayer.draw();
			} else {
				_tempObj.remove();
				classLineLayer.draw();
			}
		} else if(e.startType == "drawLineHead"){
			if(e.longPress) e.longPress = false;

			_drawingLineHead = false;
			_drawingLineHeadLine.remove();
			_drawingLineHeadLine = null;
			_lineRelationRect.setVisible(false);

			var __p = new Array();
			var ___p = new Array();

			for(var _i=0;_i<_lineHeadPoints.length;_i++)
				___p.push({
					X: _lineHeadPoints[_i].x,
					Y: _lineHeadPoints[_i].y
				});
			__p.push(___p);

			var result = _r.Recognize(__p, document
				.getElementById('useBoundedRotationInvariance').checked,
				document.getElementById('requireSameNoOfStrokes').checked,
				document.getElementById('useProtractor').checked);

			if(result.Name == "D"){
				_lineRelationRect.line.addLineHead('emptyRhombus');
			} else {
 				_lineRelationRect.line.addLineHead('emptyTriangle');
			}

			classLineLayer.draw();
			_console("changeLineHead:" + result.Name);
		} else if(e.startType == "multiOnOne"){
			if(event.targetTouches.length > 0)
				return;
			if(e.longPress) e.longPress = false;
		}
		
//		_console("touch end");
	}
}

function onGroupLongPress(obj){
	var e = obj.curEvent;
	if(e.tappedDown && e.longPress){
		_console("long press");
		e.longPress = false;
		e.startType = "longPressDrawRelation";

		var _p = e.startPoint;
		var p  = _tempObj.getClosestConnector(_p);

		var conn = new Kinetic.Line({
			points : [ p.x, p.y, _p.x, _p.y ],
			stroke : 'grey',
			strokeWidth : 3,
			lineCap : 'round',
			lineJoin : 'round',
		});

		conn.source = _tempObj;
		conn.curEvent = e;

		_tempObj = conn;

		classLineLayer.add(conn);
		classLineLayer.draw();

		_drawingLineHead = true;

	}
}

function findEventFirer(p){
	var x = p.x;
	var y = p.y;
	var obj = null;
	for(var i = 0; i < _class.length; i++){
		if(_class[i].isInside({x: x, y: y})){
				obj = _class[i];
		}
	}
	
	return obj;
}

function getPointOnCanvas(p) {
	var x = p.x;
	var y = p.y;

	var _c = stage.getContainer();
    var bbox = _c.getBoundingClientRect();

    
    return {
    	x: x - bbox.left,
    	y: y - bbox.top
    };
}

function _console(str){
	$("#status").html(str);
}

//
// Mouse Events
//
function onMouseDown(event) {
	evt = event;
	x = evt.clientX;
	y = evt.clientY;
	button = evt.button;
	document.onselectstart = function() {
		return false;
	}; // disable drag-select
	document.onmousedown = function() {
		return false;
	}; // disable drag-select
	if (button <= 1) {
		_isDown = true;
		x -= _rc.x;
		y -= _rc.y - getScrollY();
		if (_points.length == 0) {
			_strokes.length = 0;
			_g.clearRect(0, 0, _rc.width, _rc.height);
		}
		_points.length = 1; // clear
		_points[0] = new Point(x, y);
		drawText("Recording stroke #" + (_strokes.length + 1) + "...");
		var clr = "rgb(" + rand(0, 200) + "," + rand(0, 200) + ","
				+ rand(0, 200) + ")";
		_g.strokeStyle = clr;
		_g.fillStyle = clr;
		_g.fillRect(x - 4, y - 3, 9, 9);
	} else if (button == 2) {
		drawText("Recognizing gesture...");
	}
}
function onMouseMove(event) {
	evt = event;
	x = evt.clientX;
	y = evt.clientY;
	button = evt.button;
	if (_isDown) {
		x -= _rc.x;
		y -= _rc.y - getScrollY();
		_points.push(new Point(x, y)); // append
		drawConnectedPoint(_points.length - 2, _points.length - 1);
	}
}
function onMouseUp(event) {
	evt = event;
	button = evt.button;
	document.onselectstart = function() {
		return true;
	}; // enable drag-select
	document.onmousedown = function() {
		return true;
	}; // enable drag-select
	if (button <= 1) {
		if (_isDown) {
			_isDown = false;
			_strokes[_strokes.length] = _points.slice(); // add new copy to
			// set
			drawText("Stroke #" + _strokes.length + " recorded.");
		}
	} else if (button == 2) // segmentation with right-click
	{
		recognize(evt);
	}
}

function onCanvasTouchStart(evt) {
	_timeout = false;
	document.onselectstart = function() {
		return false;
	}; // disable drag-select
	document.onmousedown = function() {
		return false;
	}; // disable drag-select
	if (evt.touches.length == 1) {
		var x = evt.touches[0].clientX;
		var y = evt.touches[0].clientY;
		x -= _rc.x;
		y -= _rc.y - getScrollY();
		if (_points.length == 0) {
			_strokes.length = 0;
			_g.clearRect(0, 0, _rc.width, _rc.height);
		}
		_points.length = 1; // clear
		_points[0] = new Point(x, y);
		drawText("Recording stroke #" + (_strokes.length + 1) + "...");
		var clr = "rgb(" + rand(0, 200) + "," + rand(0, 200) + ","
				+ rand(0, 200) + ")";
		_g.strokeStyle = clr;
		_g.fillStyle = clr;
		_g.fillRect(x - 4, y - 3, 9, 9);
		drawText("Recognizing gesture...");
	}
}

function onCanvasTouchMove(evt) {
	if (evt.touches.length == 1) {
		evt.preventDefault();
		var x = evt.touches[0].clientX;
		var y = evt.touches[0].clientY;
		x -= _rc.x;
		y -= _rc.y - getScrollY();
		_points.push(new Point(x, y)); // append
		drawConnectedPoint(_points.length - 2, _points.length - 1);
	}
	// else if (evt.touches.length == 2) {
	// var x = evt.touches[0].clientX;
	// var y = evt.touches[0].clientY;
	// x -= _rc.x;
	// y -= _rc.y - getScrollY();
	// _points.push(new Point(x, y)); // append
	// drawConnectedPoint(_points.length - 2, _points.length - 1);
	// }
}

function onCanvasTouchEnd(evt) {
	document.onselectstart = function() {
		return true;
	}; // enable drag-select
	document.onmousedown = function() {
		return true;
	}; // enable drag-select

	_strokes.push(_points.slice()); // add new copy to
	// set
	drawText("Stroke #" + _strokes.length + " recorded.");

	_timeout = true;
	setTimeout("onCanvasTouchTimeout(evt);", 1000);
}

function onCanvasTouchTimeout(evt) {
	if(_timeout){
		recognize(evt);
	}
}

function onStageTouchStart(evt) {
	_usingGestures = true;
	_isDown = true;
	drawText("Using Gestures");
}

function onStageTouchMove(evt) {
	if (_isDown) {
		var x, y;
		if ('createTouch' in document) {
			x = evt.touches[0].clientX;
			y = evt.touches[0].clientY;
		} else {
			x = evt.clientX;
			y = evt.clientY;
		}
		x -= _rc.x;
		y -= _rc.y - getScrollY();
		_gesPoints.push(new Point(x, y)); // append
		// drawConnectedGesturePoint();
	}
}

function onStageTouchEnd(evt) {
	// if (_usingGestures) {
	var s = new Array();
	s.push(_gesPoints);
	var result = _r.Recognize(
			s, 
			document.getElementById('useBoundedRotationInvariance').checked, 
			document.getElementById('requireSameNoOfStrokes').checked, 
			document.getElementById('useProtractor').checked
			);
	drawText('Gesture:' + result.Name);

	var os = new Array();
	for ( var i = 0; i < _gesPoints.length; i++) {
		var gp = _gesPoints[i];
		var x = gp.X;
		var y = gp.Y;
		if (_curStage == 0) {
			for ( var j = 0; j < _user.length; j++)
				if (_user[j].isInside({
					x : x,
					y : y
				})) {
					if (arrayContains(os, _user[j]))
						_user[j].insidePoints++;
					else {
						_user[j].insidePoints = 0;
						os.push(_user[j]);
					}
				}

			for ( var j = 0; j < _usecase.length; j++)
				if (_usecase[j].isInside({
					x : x,
					y : y
				})) {
					if (arrayContains(os, _usecase[j]))
						_usecase[j].insidePoints++;
					else {
						_usecase[j].insidePoints = 0;
						os.push(_usecase[j]);
					}
				}

			for ( var j = 0; j < _sysBdry.length; j++)
				if (_sysBdry[j].isInside({
					x : x,
					y : y
				})) {
					if (arrayContains(os, _sysBdry[j]))
						_sysBdry[j].insidePoints++;
					else {
						_sysBdry[j].insidePoints = 0;
						os.push(_sysBdry[j]);
					}
				}
		} else {
			for ( var j = 0; j < _class.length; j++)
				if (_class[j].isInside(gp)) {
					if (arrayContains(os, _class[j]))
						_class[j].insidePoints++;
					else {
						_class[j].insidePoints = 0;
						os.push(_class[j]);
					}
				}

			for ( var j = 0; j < _pakage.length; j++)
				if (_pakage[j].isInside(gp)) {
					if (arrayContains(os, _pakage[j]))
						_pakage[j].insidePoints++;
					else {
						_pakage[j].insidePoints = 0;
						os.push(_pakage[j]);
					}
				}
		}
	}

	if (os.length > 0) {
		var index = 0, maxv = 0;
		for ( var i = 0; i < os.length; i++) {
			if (os[i].insidePoints > maxv) {
				maxv = os[i].insidePoints;
				index = i;
			}
		}

		os[index].deleteThis();
	}

	// }
	_usingGestures = true;
	_isDown = false;
	for ( var i = 0; i < _gesLines.length; i++) {
		_gesLines[i].remove();
		_gesLines[i].destroy();
	}
	_gesPoints = new Array();
	_gesLines = new Array();
}

function recognize() {
	var x = 0, y = 0;
	if (arguments.length > 0) {
		x = evt.clientX - _rc.x;
		y = evt.clientY - _rc.y - getScrollY();
	} else {
		x = y = 300;
	}
	if (_strokes.length > 1
			|| (_strokes.length == 1 && _strokes[0].length >= 10)) {
		var result = _r.Recognize(_strokes, document
				.getElementById('useBoundedRotationInvariance').checked,
				document.getElementById('requireSameNoOfStrokes').checked,
				document.getElementById('useProtractor').checked);
		drawText("Result: " + result.Name + " (" + round(result.Score, 2)
				+ ").");

		$('#status').html(result.Name);
//		if (result.Name == "D" || result.Name == "P"
//				|| result.Name == "half-note") {
//			drawText("Build Use Case");
//			buildUseCase(x, y);
//			onClickClearStrokes();
//			showUsecase();
//		} else if (result.Name == "T" || result.Name == "X"
//				|| result.Name == "N") {
//			drawText("Build User");
//			buildUser(x, y);
//			onClickClearStrokes();
//			showUsecase();
//		} else if (result.Name == "H") {
//			drawText("Build Class");
//			var c = buildClass(x, y);
//			c.addAttr('attr1: int', false);
//			c.addAttr('attr2: String', false);
//			c.addMeth('function1(): void', false);
//			c.addMeth('function2(): void', false);
//			onClickClearStrokes();
//			showClass();
//		} else if (result.Name == "null") {
//			drawText("Build System Boundary");
//			buildSystemBoundary(x, y);
//			onClickClearStrokes();
//			showUsecase();
//		} else if (result.Name == "pitchfork") {
//			drawText("Build Pakage");
//			buildPakage(x, y);
//			onClickClearStrokes();
//			showClass();
//		}
		if(_curStage == 0) {
			if(result.Name == "D" || result == "P" 
				|| result.Name == "half-note"){
				drawText("Build Use Case");
				buildUseCase(x, y);
				onClickClearStrokes();
			} else if (result.Name == "T" || result.Name == "X"
				|| result.Name == "N") {
				drawText("Build User");
				buildUser(x, y);
				onClickClearStrokes();
			} else if (result.Name == "pitchfork") {
				drawText("Build System Boundary");
				buildSystemBoundary(x, y);
				onClickClearStrokes();
			}
		} else if(_curStage == 1) {
			if(result.Name == "D" || result == "P" 
				|| result.Name == "half-note"){
				drawText("Build Class");
				var c = buildClass(x, y);
				c.addAttr('attr1: int', false);
				c.addAttr('attr2: String', false);
				c.addMeth('function1(): void', false);
				c.addMeth('function2(): void', false);
				onClickClearStrokes();
			} else if (result.Name == "pitchfork") {
				drawText("Build Pakage");
				buildPakage(x, y);
				onClickClearStrokes();
			}
		}
	} else {
		drawText("Too little input made. Please try again.");
	}
	_points.length = 0; // clear and signal to clear strokes on next
	// mousedown
}

// Swich Strokes or Viewer
function onClickStrokes() {
	$("#myCanvas").css("z-index", "10");
	$("#viewer").css("z-index", "1");
	$("#scroller").css("z-index", "-4");
}
function onClickViewer() {
	$("#myCanvas").css("z-index", "1");
	$("#viewer").css("z-index", "10");
	$("#scroller").css("z-index", "-4");
	onClickClearStrokes();
}
function onClickScroller() {
	$("#scroller").css("z-index", "12");
}

function showClass() {
	_wannaConn = false;
	_curConnUser = null;

	for ( var i = 0; i < _usecaseLayers.length; i++) {
		_usecaseLayers[i].hide();
	}
	for ( var i = 0; i < _classLayers.length; i++) {
		_classLayers[i].show();
		_classLayers[i].draw();
	}

	_curStage = 1;
}

function showUsecase() {
	_wannaConn = false;
	_curConnUser = null;

	for ( var i = 0; i < _classLayers.length; i++) {
		_classLayers[i].hide();
	}
	for ( var i = 0; i < _usecaseLayers.length; i++) {
		_usecaseLayers[i].show();
		_usecaseLayers[i].draw();
	}
	_curStage = 0;
}
function labelConfirm(event) {
	if (event.keyCode == 13) {
		labelEditor();
	}
}

function labelEditor() {
	$('#labelEditor').css('z-index', '-2');
	$('#labelContent').css('visibility', 'hidden');
	var s = $('#labelContent').val();
	labelContentCaller.setText(s);
	var treeItem = _store.getCertainChild(labelContentCaller.group.id
			.toString())[0];
	treeItem.name = labelContentCaller.group._getName();
	_store.put(treeItem);
	if (labelContentCaller.type == 'attribute'
			|| labelContentCaller.type == 'method') {
		labelContentCaller.rect.setWidth(labelContentCaller.getWidth());
	}
	drawLayers();
}

function drawLayers() {
	usecaseEntityLayer.draw();
	usecaseSBYLayer.draw();
	usecaseLineLayer.draw();
	classEntityLayer.draw();
	classPakageLayer.draw();
	classLineLayer.draw();
}

function putIntoTree(group) {

	var pNode = null;
	if (group.type == "User" || group.type == "Usecase"
			|| group.type == 'SystemBoundary')
		pNode = _store.getCertainChild("Usecase")[0];
	else if (group.type == "Class" || group.type == "Pakage")
		pNode = _store.getCertainChild("Class")[0];
	_store.put({
		name : group.name.getText(),
		id : group.id.toString(),
		conn : group
	}, {
		overwrite : true,
		parent : pNode
	});

}

var removeFromArray = function(_array, _value) {
	for ( var i = 0; i < _array.length; i++) {
		if (_array[i] == _value) {
			for ( var j = i; j < _array.length - 1; j++)
				_array[j] = _array[j + 1];
			_array.length--;
			return i;
		}
	}

	return -1;
};

var arrayContains = function(_array, _value) {
	for ( var i = 0; i < _array.length; i++)
		if (_array[i] == _value)
			return true;
	return false;
};

function onLineOptionSelected(event) {
	$('#lineSelector').css('z-index', '-2');
	var lo = $('#lineOptions');
	lo.css('visibility', 'hidden');
	var obj = event.target;
	var curSelectOption = obj.options[obj.selectedIndex].value;
	labelContentCaller.setText(curSelectOption);
	labelContentCaller.line.addLineHead(curSelectOption);
	usecaseLineLayer.draw();
	classLineLayer.draw();
}

function addLines(x1, y1, x2, y2, sourceId, terminalId, name) {
	var source = null, terminal = null, lineLayer = usecaseLineLayer;

	for ( var i = 0; i < _objects.length; i++) {
		for ( var j = 0; j < _objects[i].length; j++) {
			var u = _objects[i][j];
			if (sourceId == u.id)
				source = u;
			if (terminalId == u.id)
				terminal = u;
		}
	}

	if (source.type == "User") {
		lineLayer = usecaseLineLayer;
	} else if (source.type == "Class") {
		lineLayer = classLineLayer;
	}

	if (source != null && terminal != null) {
		var conn = drawLine(x1, y1, x2, y2, source, terminal, lineLayer, name);
		source.connectedObjects.push(terminal);
		terminal.connectedObjects.push(source);
		conn.addLineHead(name);

	} else {
		alert("in addLines(), NullPointerException\n" + "sourceId: " + sourceId
				+ " terminalId: " + terminalId);
	}
}

function drawLine(x1, y1, x2, y2, source, terminal, lineLayer, nameText) {
	var n;
	if (nameText == undefined)
		n = 'relationship';
	else if (nameText != "")
		n = nameText;
	else
		n = "";

	var dashArray = [ 10, 0 ];
	if (source.type == "Usecase" && terminal.type == "Usecase")
		dashArray = [ 10, 10 ];
	var conn = new Kinetic.Line({
		points : [ x1, y1, x2, y2 ],
		stroke : 'grey',
		strokeWidth : 3,
		lineCap : 'round',
		lineJoin : 'round',
		dashArray : dashArray
	});

	var name = new Kinetic.Text({
		x : ((x1 + x2) >> 1) - 20,
		y : ((y1 + y2) >> 1) - 20,
		text : n,
		fontSize : 12,
		fontFamily : 'Calibri',
		fill : 'black',
		padding : 20
	});

	name.on('mousedown tap', function() {
		_usingGestures = false;
		$('#lineOptions').css('left', (this.getX() - 10).toString() + 'px');
		$('#lineOptions').css('top', (this.getY() + 10).toString() + 'px');
		$('#lineOptions').val(this.getText());
		$('#lineOptions')
				.css('width', (this.getWidth() + 20).toString() + 'px');
		$('#lineOptions').css('visibility', 'visible');
		$('#lineSelector').css('z-index', '12');
		labelContentCaller = this;
	});

	name.on('mouseover', function() {
		_usingGestures = false;
		document.body.style.cursor = 'pointer';
	});

	name.on('mouseout', function() {
		_usingGestures = false;
		document.body.style.cursor = 'default';
	});

	name.text = n;
	name.line = conn;
	conn.source = source;
	conn.terminal = terminal;
	conn.name = name;
	conn.lineHeads = new Array();
	conn.lineLayer = lineLayer;
	conn.deleteThis = function() {
		for ( var i = 0; i < this.lineHeads; i++) {
			this.lineHeads[i].remove();
			this.lineHeads[i].destroy();
		}

		this.name.remove();
		this.name.destroy();

		this.remove();
		this.destroy();
	};

	conn.refreshName = function() {
		// Refresh the position of the label of the line as well as the line
		// heads
		var p = this.getPoints();
		var x = ((p[0].x + p[1].x) >> 1) - 20;
		var y = ((p[0].y + p[1].y) >> 1) - 20;
		this.name.setX(x);
		this.name.setY(y);

		// Change the position of line heads and rotate them to the right
		// direction
		var p = this.getPoints();

		// Calculate the radian by which the head needs to rotate
		var tan;
		if ((p[1].x - p[0].x) != 0)
			tan = (p[0].y - p[1].y) / (p[1].x - p[0].x);
		else if (p[0].y > p[1].y)
			tan = 1000;
		else
			tan = -1000;
		var area = 1;
		if ((p[1].y - p[0].y) > 0) {
			if ((p[1].x - p[0].x) > 0)
				area = 4;
			else
				area = 2;
		} else {
			if ((p[1].x - p[0].x) > 0)
				area = 1;
			else
				area = 2;
		}
		var r = Math.atan(tan);
		r = PI_2 - r;
		if (area == 2 || area == 3)
			r += PI;

		for ( var i = 0; i < this.lineHeads.length; i++) {
			this.lineHeads[i].setAbsolutePosition(p[1].x, p[1].y);
			this.lineHeads[i].setRotation(r);
		}
	};

	conn.addLineHead = function(type) {
		var existsThisHead = false;
		for ( var i = 0; i < this.lineHeads.length; i++) {
			var h = this.lineHeads[i];
			if (h.type != type)
				h.hide();
			else {
				h.show();
				existsThisHead = true;
			}
		}
		if (!existsThisHead) {
			var p = this.getPoints();

			// Calculate the radian by which the head needs to rotate
			var tan;
			if ((p[1].x - p[0].x) != 0)
				tan = (p[0].y - p[1].y) / (p[1].x - p[0].x);
			else
				tan = PI_2;
			var area = 1;
			if ((p[1].y - p[0].y) > 0) {
				if ((p[1].x - p[0].x) > 0)
					area = 4;
				else
					area = 2;
			} else {
				if ((p[1].x - p[0].x) > 0)
					area = 1;
				else
					area = 2;
			}
			var r = Math.atan(tan);
			r = PI_2 - r;
			if (area == 2 || area == 3)
				r += PI;

			var lineHead = buildLineHead(p[1], r, type, this.lineLayer);
			lineHead.line = this;
			this.lineHeads.push(lineHead);
			return true;
		} else
			return false;
	};

	if(!nameText == "")
		conn.addLineHead(nameText);
	
	if(source && source != null)
		source.lines.push(conn);
	if(terminal && terminal != null)
		terminal.lines.push(conn);
	_line.push(conn);
	lineLayer.add(conn);
	lineLayer.add(name);
	lineLayer.draw();

	return conn;
}

function buildLineHead(p, angle, type, lineLayer) {
	var x = p.x;
	var y = p.y;
	var lineHead = new Kinetic.Group({
		x : x,
		y : y,
	});

	if (type == 'filledTriangle') {
		var poly = new Kinetic.Polygon({
			points : [ 0, 0, 10, 12, -10, 12 ],
			fill : 'black',
			stroke : 'black',
			strokeWidth : 1
		});

		lineHead.add(poly);
	} else if (type == 'emptyTriangle') {
		var poly = new Kinetic.Polygon({
			points : [ 0, 0, 10, 12, -10, 12 ],
			fill : 'white',
			stroke : 'black',
			strokeWidth : 1
		});

		lineHead.add(poly);
	} else if (type == 'filledRhombus') {
		var poly = new Kinetic.Polygon({
			points : [ 0, 0, 10, 15, 0, 30, -10, 15 ],
			fill : 'black',
			stroke : 'black',
			strokeWidth : 1
		});

		lineHead.add(poly);
	} else if (type == 'emptyRhombus') {
		var poly = new Kinetic.Polygon({
			points : [ 0, 0, 10, 15, 0, 30, -10, 15 ],
			fill : 'white',
			stroke : 'black',
			strokeWidth : 1
		});

		lineHead.add(poly);
	}

	lineHead.type = type;
	lineHead.rotate(angle);
	lineLayer.add(lineHead);
	return lineHead;
}

// -->
