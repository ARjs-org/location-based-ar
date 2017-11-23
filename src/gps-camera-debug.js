AFRAME.registerComponent('gps-camera-debug', {
	init : function(){
		var camera = this.el
		
		//////////////////////////////////////////////////////////////////////////////
		//		Create html
		//////////////////////////////////////////////////////////////////////////////
		var domElement = document.createElement('div')
		domElement.innerHTML = `
		<!-- TODO build that directly in the javascript -->
		<div style="position: fixed; top: 10px; width:100%; text-align: center; z-index: 1; text-shadow: -1px 0 white, 0 1px white, 1px 0 white, 0 -1px white;">
			<div>
				current lng/lat coords: <span id="current_coords_longitude"></span>, <span id="current_coords_latitude"></span>
			</div>
			<div>
				origin lng/lat coords: <span id="origin_coords_longitude"></span>, <span id="origin_coords_latitude"></span>
			</div>
			<div>
				camera 3d position: <span id="camera_p_x"></span>, <span id="camera_p_z"></span>
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
					var compassRotation = camera.components['gps-camera-rotation']
					var lookControls = camera.components['look-controls']

					camera_angle.innerText = event.detail.newData.y.toFixed(2)

					if( lookControls ){
						yaw_angle.innerText = THREE.Math.radToDeg(lookControls.yawObject.rotation.y).toFixed(2)
					}
					if( compassRotation && compassRotation.heading !== null ){
						compass_heading.innerText = compassRotation.heading.toFixed(2)
					}
					break
				case 'position':
					//console.log('camera position changed', event.detail.newData)
					camera_p_x.innerText = event.detail.newData.x
					camera_p_z.innerText = event.detail.newData.z

					var gpsPosition = camera.components['gps-camera-position']
					if( gpsPosition ){
						if(gpsPosition.currentCoords){
							current_coords_longitude.innerText = gpsPosition.currentCoords.longitude
							current_coords_latitude.innerText = gpsPosition.currentCoords.latitude
						}
						if(gpsPosition.originCoords){
							origin_coords_longitude.innerText = gpsPosition.originCoords.longitude
							origin_coords_latitude.innerText = gpsPosition.originCoords.latitude
						}
					}
					
					break
			}
		})
		
	}
})
