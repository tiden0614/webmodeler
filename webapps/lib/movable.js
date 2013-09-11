define(["dojo/_base/declare","serializablecomponent","imarray"],function(declare,SerializableComponent,ImArray){
	return declare(SerializableComponent,{
		_moveList: null,
		constructor: function(config){
			
		},
		addMoveCom: function(com){
			if(this._moveList == null) this._moveList = new ImArray();
			this._moveList.pushNonRepitition(com);
		},
		moveThis: function(x,y){
			for(var i=0;i<this._moveList.getLength();i++)
				this._moveList.get(i)._move(x,y);
			this.move(x,y);
		}
	});
});