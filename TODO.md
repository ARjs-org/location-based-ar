- gps-place: only one parameters. location
- a lot of components options are uselessly complex

- camera initialisation isnt compatible with marker projection matrix
  - see how to make it so

- make a good example
  - how to handle the specific of the user latitude/longitude


- display stuff independantly of the Z
  - thus the tracking seems less bad

- make components name more uniforms - more ar.js like
  - gps-place - for an object in real world
  - gps-debug - for camera - to display debug
  - compass-rotation - for camera - to set the compass of the camera
  - gps-position - for camera - to set the position from the gps
  - put arjs-gps-* instead of gps-
  - new name => arjs-gps-location and arjs-gps-camera

- improve object location to be searched by google maps or similar
  - thus no need to push unreadable coordinates


- DONE put the aframe components in their own file
- DONE make a debug layer
  - component gps-debug on camera


# Possible Demo
- put several spot in the real world
  - well known cities
  - search local interest: e.g. closest restaurants, museums
- display them with a a-text
- name of the place + distance from the camera
- display them independantly from the distance to the camera
