define(["dojo/_base/declare","imarray","kinetic"],function(declare,imarray,Kinetic){
	
	var _lastId = 0;
	
	var SerializableComponent = declare(Kinetic.Group,{
		_comType: null,
		_comLabel: null,
		_comId: null,
		constructor: function(config){
			// Yet we do not know if this is necessary.
			//this.setAttrs(config);
			this.setComId(_lastId++);
		},
		setComType: function(type){
			this._type = type;
		},
		setComLabel: function(label){
			this._comLabel = label;
		},
		setComId: function(id){
			this._comId = id;
		},
		getLastId: function(){
			return _lastId;
		},
		getXMLSegment: function(){
			// to be override
		},
		equals: function(obj){
			// to be override
			return this == obj;
		}
	});
	
	SerializableComponent.getLastId = function(){
		return _lastId;
	};
	
	return SerializableComponent;
});