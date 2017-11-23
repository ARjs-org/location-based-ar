AFRAME.registerComponent('gps-camera-position', {
	
	_watchPositionId: null,

	originCoords: null,
	currentCoords: null,
	
	schema: {
		minAccuracy: {
			type: 'int',
			default: 100
		},
	},
	
	init: function () {
		
		this._watchPositionId = this._initWatchGPS(function(position){
			// https://developer.mozilla.org/en-US/docs/Web/API/Coordinates
			this.currentCoords = position.coords
			this._updatePosition()
		}.bind(this))
		
	},
	remove: function() {
		if(this._watchPositionId) navigator.geolocation.clearWatch(this._watchPositionId)
		this._watchPositionId = null
	},
	
	_initWatchGPS: function( onSuccess, onError ){
		// TODO put that in .init directly

		if( onError === undefined ){
			onError = function(err) { console.warn('ERROR('+err.code+'): '+err.message) }			
		}

		if( "geolocation" in navigator === false ){
			onError({code: 0, message: 'Geolocation is not supported by your browser'})
			return
		}

		// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition
		return navigator.geolocation.watchPosition(onSuccess, onError, {
			enableHighAccuracy: true,
			maximumAge: 0,
			timeout: 27000
		})
	},

	_updatePosition: function () {
		// dont update if accuracy isnt good enough
		if( this.currentCoords.accuracy > this.data.minAccuracy )	return
		
		// init originCoords if needed
		if( this.originCoords === null ) this.originCoords = this.currentCoords
		
		var position = this.el.getAttribute('position')
		
		// compute position.x
		var dstCoords = {
			longitude: this.currentCoords.longitude,
			latitude: this.originCoords.latitude
		}
		position.x = this.computeDistanceMeters(this.originCoords, dstCoords)
		position.x *= this.currentCoords.longitude > this.originCoords.longitude ? 1 : -1
		
		// compute position.z
		var dstCoords = {
			longitude: this.originCoords.longitude,
			latitude: this.currentCoords.latitude
		}
		position.z = this.computeDistanceMeters(this.originCoords, dstCoords)
		position.z *= this.currentCoords.latitude > this.originCoords.latitude ? -1 : 1
		
		// update element position
		this.el.setAttribute('position', position)
	},
	
	computeDistanceMeters: function(src, dest) {
		// 'Calculate distance, bearing and more between Latitude/Longitude points'
		// https://www.movable-type.co.uk/scripts/latlong.html
		var dlon = THREE.Math.degToRad(dest.longitude - src.longitude)
		var dlat = THREE.Math.degToRad(dest.latitude - src.latitude)
		
		var a = (Math.sin(dlat / 2) * Math.sin(dlat / 2)) + Math.cos(THREE.Math.degToRad(src.latitude)) * Math.cos(THREE.Math.degToRad(dest.latitude)) * (Math.sin(dlon / 2) * Math.sin(dlon / 2))
		var angle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
		
		return angle * 6378160
	},
	
	
})
