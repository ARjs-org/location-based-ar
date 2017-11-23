//////////////////////////////////////////////////////////////////////////////
//		component gps-position
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerComponent('gps-position', {
	
	_watchPositionId: null,

	originCoords: null,
	currentCoords: null,
	
	schema: {
		accuracy: {
			type: 'int',
			default: 100
		},
		'origin-coords-latitude': {
			type: 'number',
			default: NaN
		},
		'origin-coords-longitude': {
			type: 'number',
			default: NaN
		}
	},
	
	init: function () {
		
		if( !isNaN(this.data['origin-coords-latitude']) && !isNaN(this.data['origin-coords-longitude']) ){
			this.originCoords = {latitude: this.data['origin-coords-latitude'], longitude: this.data['origin-coords-longitude']}
		}
		
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
		if( this.currentCoords.accuracy > this.data.accuracy )	return
		
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


//////////////////////////////////////////////////////////////////////////////
//		component compass-rotation 
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerComponent('compass-rotation', {
	
	lookControls: null,
	lastTimestamp: 0,
	heading: null,
	
	
	schema: {
		fixTime: {
			type: 'int',
			default: 2000
		},
		orientationEvent: {
			type: 'string',
			default: 'auto'
		}
	},
	
	init: function () {
		
		if( this.el.components['look-controls'] === undefined ) return
		
		this.lookControls = this.el.components['look-controls']
		
		this.handlerOrientation = this.handlerOrientation.bind(this)
		
		if( this.data.orientationEvent === 'auto' ){
			if('ondeviceorientationabsolute' in window){
				this.data.orientationEvent = 'deviceorientationabsolute'
			}else if('ondeviceorientation' in window){
				this.data.orientationEvent = 'deviceorientation'
			}else{
				this.data.orientationEvent = ''
				alert('Compass not supported')
				return
			}
		}
		
		window.addEventListener( this.data.orientationEvent, this.handlerOrientation, false)
		
		window.addEventListener('compassneedscalibration', function(event) {
			alert('Your compass needs calibrating! Wave your device in a figure-eight motion')
			event.preventDefault()
		}, true)
		
	},
	
	tick: function( time, timeDelta ){
		
		if(this.heading === null || this.lastTimestamp > (time - this.data.fixTime)) return
		
		this.lastTimestamp = time
		this._updateRotation()
		
	},
	
	_computeCompassHeading: function (alpha, beta, gamma) {
		
		// Convert degrees to radians
		var alphaRad = alpha * (Math.PI / 180)
		var betaRad = beta * (Math.PI / 180)
		var gammaRad = gamma * (Math.PI / 180)
		
		// Calculate equation components
		var cA = Math.cos(alphaRad)
		var sA = Math.sin(alphaRad)
		var cB = Math.cos(betaRad)
		var sB = Math.sin(betaRad)
		var cG = Math.cos(gammaRad)
		var sG = Math.sin(gammaRad)
		
		// Calculate A, B, C rotation components
		var rA = - cA * sG - sA * sB * cG
		var rB = - sA * sG + cA * sB * cG
		var rC = - cB * cG
		
		// Calculate compass heading
		var compassHeading = Math.atan(rA / rB)
		
		// Convert from half unit circle to whole unit circle
		if(rB < 0) {
			compassHeading += Math.PI
		}else if(rA < 0) {
			compassHeading += 2 * Math.PI
		}
		
		// Convert radians to degrees
		compassHeading *= 180 / Math.PI
		
		return compassHeading
	},
	
	handlerOrientation: function( event ){
		
		var heading = null
		
		//console.log('device orientation event', event)
		
		if( event.webkitCompassHeading  !== undefined ){
			
			if(event.webkitCompassAccuracy < 50){
				heading = event.webkitCompassHeading
			}else{
				console.warn('webkitCompassAccuracy is event.webkitCompassAccuracy')
			}
			
		}else if( event.alpha !== null ){
			if(event.absolute === true || event.absolute === undefined ) {
				heading = this._computeCompassHeading(event.alpha, event.beta, event.gamma)
			}else{
				console.warn('event.absolute === false')
			}
		}else{
			console.warn('event.alpha === null')
		}
		
		this.heading = heading	
	},
	
	_updateRotation: function() {
		
		/*
		camera.components["look-controls"].yawObject.rotation.y = THREE.Math.degToRad(
			(
				360
				- camera.components["compass-rotation"].heading
				- (
					camera.getAttribute('rotation').y
					- THREE.Math.radToDeg(camera.components["look-controls"].yawObject.rotation.y)
				)
			)
			% 360
		)
		*/
		
		
		var heading = 360 - this.heading
		var camera_rotation = this.el.getAttribute('rotation').y
		var yaw_rotation = THREE.Math.radToDeg(this.lookControls.yawObject.rotation.y)
		
		var offset = ( heading - ( camera_rotation - yaw_rotation ) ) % 360
		
		this.lookControls.yawObject.rotation.y = THREE.Math.degToRad(offset)
		
	},
	
	remove: function () {
		if(this.data.orientationEvent){			
			window.removeEventListener(this.data.orientationEvent, this.handlerOrientation, false)
		}
	}
	
})


//////////////////////////////////////////////////////////////////////////////
//		Component gps-debug
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerComponent('gps-debug', {
	init : function(){
		var camera = this.el;
		
		//////////////////////////////////////////////////////////////////////////////
		//		Create html
		//////////////////////////////////////////////////////////////////////////////
		var domElement = document.createElement('div')
		domElement.innerHTML = `
		<!-- TODO build that directly in the javascript -->
		<div style="position: fixed; top: 10px; width:100%; text-align: center; z-index: 1; text-shadow: -1px 0 white, 0 1px white, 1px 0 white, 0 -1px white;">
			<div>
				current coords: <span id="current_coords_longitude"></span>, <span id="current_coords_latitude"></span>
				(origin coords: <span id="origin_coords_longitude"></span>, <span id="origin_coords_latitude"></span>)
			</div>
			<div>
				camera coords: <span id="camera_p_x"></span>, <span id="camera_p_z"></span>
			</div>
			<div>
				compass heading: <span id="compass_heading"></span>,
				camera angle: <span id="camera_angle"></span>,
				yaw angle: <span id="yaw_angle"></span>
			</div>
		</div>
		`
		document.body.appendChild(domElement.children[0])

		// TODO cleanup this code
		// TODO build the html element in there

		camera.addEventListener('componentchanged', function (event) {
			switch(event.detail.name){
				case 'rotation':
					//console.log('camera rotation changed', event.detail.newData);
					var compassRotation = camera.components['compass-rotation']
					var lookControls = camera.components['look-controls']

					camera_angle.innerText = event.detail.newData.y;

					if( lookControls ){
						yaw_angle.innerText = THREE.Math.radToDeg(lookControls.yawObject.rotation.y);
					}
					if( compassRotation ){
						compass_heading.innerText = compassRotation.heading;
					}
					break;
				case 'position':
					//console.log('camera position changed', event.detail.newData);
					camera_p_x.innerText = event.detail.newData.x;
					camera_p_z.innerText = event.detail.newData.z;

					var gpsPosition = camera.components['gps-position'];
					if( gpsPosition ){
						if(gpsPosition.currentCoords){
							current_coords_longitude.innerText = gpsPosition.currentCoords.longitude;
							current_coords_latitude.innerText = gpsPosition.currentCoords.latitude;
						}
						if(gpsPosition.originCoords){
							origin_coords_longitude.innerText = gpsPosition.originCoords.longitude;
							origin_coords_latitude.innerText = gpsPosition.originCoords.latitude;
						}
					}
					
					break;
			}
		});
		
	}
})


//////////////////////////////////////////////////////////////////////////////
//		Component gps-place
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerComponent('gps-place', {
	
	_cameraGpsPosition: null,
	_deferredInitInterval: 0,
	
	schema: {
		latitude: {
			type: 'number',
			default: 0
		},
		longitude: {
			type: 'number',
			default: 0
		},
		cameraSelector: {	// TODO do i need this ?
			type: 'string',
			default: 'a-camera, [camera]'
		}
	},
	
	init: function () {
		if( this._deferredInit() ) return
		this._deferredInitInterval = setInterval(this._deferredInit.bind(this), 100)
	},
	
	_deferredInit: function () {
		
		if( this._cameraGpsPosition === null ){
			var camera = document.querySelector(this.data.cameraSelector)
			if(typeof(camera.components['gps-position']) == 'undefined') return
			this._cameraGpsPosition = camera.components['gps-position']
		}
		
		if( this._cameraGpsPosition.originCoords === null ) return
		
		this._updatePosition()
		
		clearInterval(this._deferredInitInterval)
		this._deferredInitInterval = 0
		
		return true
	},
	
	_updatePosition: function() {
		
		var position = {x: 0, y: 0, z: 0}
		
		// update position.x
		var dstCoords = {
			longitude: this.data.longitude,
			latitude: this._cameraGpsPosition.originCoords.latitude
		}
		position.x = this._cameraGpsPosition.computeDistanceMeters( this._cameraGpsPosition.originCoords, dstCoords )
		position.x *= this.data.longitude > this._cameraGpsPosition.originCoords.longitude ? 1 : -1
		
		// update position.z
		var dstCoords = {
			longitude: this._cameraGpsPosition.originCoords.longitude,
			latitude: this.data.latitude
		}
		position.z = this._cameraGpsPosition.computeDistanceMeters(this._cameraGpsPosition.originCoords, dstCoords)
		position.z *= this.data.latitude > this._cameraGpsPosition.originCoords.latitude	? -1 : 1
		
		// update element's position
		this.el.setAttribute('position', position)
	}
})
