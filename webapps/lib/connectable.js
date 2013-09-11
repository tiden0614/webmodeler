define(["dojo/_base/declare","container","imarray","serializablecomponent","kinetic"],
		function(declare,Container,ImArray,SerializableComponent,Kinetic){
	
	var MAXDISTANCE = Number.MAX_VALUE;
	var lineLayer = null;
	
	var buildLineHead = function(p,angle,type){
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
	};
	
	var Connector = declare(null,{
		_parent: null,
		_connectPoint: null,
		constructor: function(config){
			if(config[parent]) this._parent = config[parent];
			if(config[x]) this._connectPoint.x = config[x];
			if(config[y]) this._connectPoint.y = config[y];
		},
		getDistance: function(p){
			var ap = _parent.getAbsolutePostion();
			var  x = _connectPoint.x;
			var  y = _connectPoint.y;
			var dx = (p.x - ap.x - x) * (p.x - ap.x - x);
			var dy = (p.y - ap.y - y) * (p.y - ap.y - y);
			return dx + dy;
		},
		_move: function(x,y){
			// to be implemented
		},
		setConnectPoint: function(p){
			this._connectPoint = p;
		},
		getConnectPoint: function(){
			return this._connectPoint;
		},
		equals: function(obj){
			return this._connectPoint == obj.getConnectPoint() && this._parent == obj._parent;
		}
	});
	
	var ConnectObject = declare(SerializableComponent,{
		_source: null,
		_target: null,
		_lineObj: null,
		_type: null,
		_label: null,
		_lineHeads: null,
		constructor: function(config){
			this._source = config[source];
			this._target = config[target];
			this._source.addConnectedObject(this);
			this._target.addConnectedObject(this);
			var ps = this._source.getAbsolutePosition();
			var pt = this._target.getAbsolutePosition();
			var p1 = this._source.getClosestConnector(pt).getConnectPoint();
			var p2 = this._target.getClosestConnector(ps).getConnectPoint();
			this._lineObj = new Kinetic.Line({
				points: [p1.x,p1.y,p2.x,p2.y],
				stroke : 'grey',
				strokeWidth : 3,
				lineCap : 'round',
				lineJoin : 'round',
			});
			this._label = new Kinetic.Line({
				x : ((p1.x + p2.x) >> 1) - 20,
				y : ((p1.y + p2.y) >> 1) - 20,
				text : "",
				fontSize : 12,
				fontFamily : 'Calibri',
				fill : 'black',
				padding : 20
			});
			if(lineLayer == null) lineLayer = new Kinetic.Layer();
			lineLayer.add(this._lineObj);
			lineLayer.add(this._label);
		},
		getSource: function(){
			return this._source;
		},
		getTarget: function(){
			return this._lineObj;
		},
		getTheOtherEnd: function(obj){
			return obj==this._source? this._source: this._target;
		},
		moveLine: function(){
			
			var ps = this._source.getAbsolutePosition();
			var pt = this._target.getAbsolutePosition();
			var p1 = this._source.getClosestConnector(pt).getConnectPoint();
			var p2 = this._target.getClosestConnector(ps).getConnectPoint();
			
			this._lineObj.setPoints([p1.x,p1.y,p2.x,p2.y]);
			
			// Refresh the position of the label of the line as well as the line
			// heads
			var p = this._lineObj.getPoints();
			var x = ((p[0].x + p[1].x) >> 1) - 20;
			var y = ((p[0].y + p[1].y) >> 1) - 20;
			this._label.setX(x);
			this._label.setY(y);

			// Change the position of line heads and rotate them to the right
			// direction

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

			for ( var i = 0; i < this._lineHeads.length; i++) {
				this._lineHeads[i].setAbsolutePosition(p[1].x, p[1].y);
				this._lineHeads[i].setRotation(r);
			}
		},
		equals: function(obj){
			return this._target = obj._target && this._source == obj._source && this._type == obj._type;
		},
		deleteThis: function(){
			// to be implemented
		},
		setLabel: function(text){
			this._label.setText(text);
		},
		addLineHead: function(type){
			if(this._lineHeads == null) this._lineHeads = new Array();
			var existsThisHead = false;
			for ( var i = 0; i < this._lineHeads.length; i++) {
				var h = this._lineHeads[i];
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

				var lineHead = buildLineHead(p[1], r, type);
				lineHead.line = this._lineObj;
				this._lineHeads.push(lineHead);
				return true;
			} else
				return false;
		}
		
	});
	
	return declare(Container,{
		_connectors: null,
		_connectedObjects: null,
		addConnector: function(config){
			if(this._connectors == null) this._connectors = new ImArray();
			config[parent] = this;
			var c = new Connector(config);
			return this._connectors.pushNonRepitition(c);
		},
		addConnectedObject: function(obj){
			if(this._connectedObjects == null) this._connectedObjests = new ImArray();
			return this._connectors.pushNonRepitition(obj);
		},
		getClosestConnector: function(p){
			if(this._connectors == null) return null;
			var d = MAXDISTANCE;
			var c = null;
			for(var i=0;i<this._connector.getLength();i++){
				var _c = this._connector.get(i);
				var _d = _c.getDistance(p);
				if(_d<d){
					d = _d;
					c = _c;
				}
			}
			return c;
		},
		moveConnectedLines: function(x,y){
			if(this._connectors == null || this._connectedObjects == null) return;
			for(var i=0;i<this._connectedObjects.getLength();i++){
				var _c = this._connectedObjects.get(i);
				var _p = this.getClosestConnector(_c.getAbsolutePosition()).getConnectPoint();
				// to be implemented
			}
		},
		connectToThis: function(obj){
			var _co = new ConnectObject({
				source: this,
				target: obj,
			});
		}
	});
});