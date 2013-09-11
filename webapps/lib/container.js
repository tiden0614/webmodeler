define(["dojo/_base/delcare","movable"],function(declare,Movable){
	return declare(Movable,{
		_parent: null,
		_comList: null,
		_hitArea: null,
		constructor: function(config){
			
		},
		addHitArea: function(area){
			if(this._hitArea = null) this._hitArea = new ImArray();
			return this._hitArea.pushNonRepitition(area);
		},
		isInside: function(p){
			if(this._hitArea == null) return false;
			var ap = this.getAbsolutePosition();
			for(var i=0;i<this._hitArea.getLength();i++){
				var a = this._hitArea.get(i);
				if(p.x > ap.x + a.x1 && p.x < ap.x + a.x2 && p.y > ap.y + a.y1 && p.y < ap.y + a.y2)
					return true;
			};
			return false;
		}
	});
});