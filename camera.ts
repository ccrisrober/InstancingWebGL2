// Path tracer in WebGL2
// Copyright (C) <2016> 
//    - Cristian Rodríguez Bernal (maldicion069)
//    - Juan Guerrero Martín (hire33)
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

/// <reference path="gl-matrix.d.ts" />
/// <reference path="globals.ts" />

class Camera {
    // Camera attrs
    public position : Float32Array;
    protected front : Float32Array;
    protected up : Float32Array;
    protected right : Float32Array;
    protected worldUp : Float32Array;

    // Euler angles
    protected yaw : number;
    protected pitch : number;

    // Camera options
    protected movSpeed : number = 0.5;
    protected mouseSensivity : number = 0.25;

    public GetPos() : Float32Array {
        return this.position;
    }

    public timeElapsed : number;

    constructor(position: Float32Array = vec3.fromValues(0, 0, 0), 
        up: Float32Array = vec3.fromValues(0, 1, 0), yaw : number = -90.0, pitch : number = 0.0) {
        this.front = vec3.fromValues(0, 0, -1);
        this.position = position;
        this.worldUp = up;
        this.yaw = yaw;
        this.pitch = pitch;

        this.right = vec3.create();
        this.up = vec3.create();

        this.updateCameraVectors();
    }

    public processKeyboard(direction: number, deltaTime : number) {
        var velocity : number = this.movSpeed * this.timeElapsed; //deltaTime;
        //console.log(direction);
        if(direction == 0) {
            this.position = vec3.scaleAndAdd(this.position, this.position, this.front, velocity);
        } else if(direction == 1) {
            this.position = vec3.scaleAndAdd(this.position, this.position, this.front, -velocity);
        } else if(direction == 2) {
            this.position = vec3.scaleAndAdd(this.position, this.position, this.right, -velocity);
        } else if(direction == 3) {
            this.position = vec3.scaleAndAdd(this.position, this.position, this.right, velocity);
        } else if(direction == 4) {
            this.position = vec3.scaleAndAdd(this.position, this.position, this.up, velocity);
        } else if(direction == 5) {
            this.position = vec3.scaleAndAdd(this.position, this.position, this.up, -velocity);
        }
    }

    public processMouseMovement(xOffset: number, yOffset: number) {
        this.yaw += xOffset;
        this.pitch += yOffset;

        if(this.pitch > 89.0) {
            this.pitch = 89.0;
        }
        if(this.pitch < -89.0) {
            this.pitch = -89.0;
        }
        this.updateCameraVectors();
    }

    public updateCameraVectors() {
        var front : Float32Array = vec3.fromValues(
            Math.cos(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch)),
            Math.sin(glMatrix.toRadian(this.pitch)),
            Math.sin(glMatrix.toRadian(this.yaw)) * Math.cos(glMatrix.toRadian(this.pitch))
        );
        this.front = vec3.normalize(this.front, front);

        // Recalculate right and up vector
        this.right = vec3.cross(this.right, this.front, this.worldUp);
        this.right = vec3.normalize(this.right, this.right);
        this.up = vec3.cross(this.up, this.right, this.front);
        this.up = vec3.normalize(this.up, this.up);
    }

    private view : Float32Array = mat4.create();
    private proj : Float32Array = mat4.create();

    public GetViewMatrix() : Float32Array {
        var aux = vec3.create();
        this.view = mat4.lookAt(this.view, this.position, vec3.add(aux, this.position, this.front), this.up);
        return this.view;
    }

    public GetProjectionMatrix() : Float32Array {
        this.proj = mat4.perspective(this.proj, 45.0, size[0]/size[1], 0.1, 100);
        return this.proj;
    }
}