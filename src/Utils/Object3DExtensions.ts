import { Object3D } from "three";
import { string } from "three/examples/jsm/nodes/Nodes.js";


declare module 'three' {
	interface Object3D {
		getObjectByUserDataProperty(this:Object3D, name:string, value:any, stringify?: boolean): Object3D|undefined;
		getObjectsByUserDataProperty(this:Object3D, name:string, value:any, stringify?: boolean): Object3D[];
    }
}
Object3D.prototype.getObjectByUserDataProperty = getObjectByUserDataProperty;
function getObjectByUserDataProperty(this:Object3D, name:string, value:any, stringify: boolean=false): Object3D|undefined {
	if(stringify) 
		value = JSON.stringify(value);
	if ( this.userData[ name ] === value ) 
        return this;
	for ( var i = 0, l = this.children.length; i < l; i ++ ) {
		let child = this.children[ i ];
		let object = child.getObjectByUserDataProperty( name, value );
		if ( object !== undefined ) {
			return object;
		}
	}
	return undefined;
}
Object3D.prototype.getObjectsByUserDataProperty = getObjectsByUserDataProperty;
function getObjectsByUserDataProperty(this:Object3D, name:string, value:any, stringify: boolean=false): Object3D[]{
	if(stringify) 
		value = JSON.stringify(value);
	let objects: Object3D[] = [];
	this.traverse((o)=>{
		let objData = o.userData[name];
		if(stringify) objData = JSON.stringify(objData);
		if(objData === value){
			objects.push(o);
		}
	});
	return objects;
}