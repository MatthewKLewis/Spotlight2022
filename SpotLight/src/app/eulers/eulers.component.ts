import { Component, OnInit } from '@angular/core';
import { SpotlightService } from './spotlight.service';

@Component({
  selector: 'app-eulers',
  templateUrl: './eulers.component.html',
  styleUrls: ['./eulers.component.scss']
})
export class EulersComponent implements OnInit {

  IMAGE_WIDTH: number = 829; //829 Pixels Represents 6.096m.
  IMAGE_HEIGHT: number = 829;
  SPACE_WIDTH: number = 6.096; //And vice versa
  SPACE_HEIGHT: number = 6.096;
  SPOTLIGHT_X: number = 619;
  SPOTLIGHT_Y: number = 203;
  IMAGE_HORIZONTAL_PPF: number = this.IMAGE_WIDTH / this.SPACE_WIDTH;
  IMAGE_VERTICAL_PPF: number = this.IMAGE_HEIGHT / this.SPACE_HEIGHT;

  cnv!: HTMLCanvasElement
  ctx!: CanvasRenderingContext2D
  image: any = new Image(this.IMAGE_WIDTH,this.IMAGE_HEIGHT)
  chosenSpotlight:number = 0
  coordinates: Array<string> = ['0','0']

  constructor(public spotLightService: SpotlightService) { }

  ngOnInit(): void {
    this.cnv = <HTMLCanvasElement>document.querySelector('#canvas')
    this.ctx = <CanvasRenderingContext2D>this.cnv.getContext('2d')
    this.image.src = '../../assets/booth.png'
    this.image.onload = () => { this.ctx.drawImage(this.image, 0, 0, this.IMAGE_WIDTH, this.IMAGE_HEIGHT) }
    this.cnv.width = this.IMAGE_WIDTH
    this.cnv.height = this.IMAGE_HEIGHT
    this.ctx.lineWidth = 14;
    this.ctx.strokeStyle = 'rgba(255, 221, 83, 0.5)';
  }

  canvasClick(evt: any) {
    var x = (evt.pageX - evt.originalTarget.offsetLeft);
    var y = (evt.pageY - evt.originalTarget.offsetTop);

    console.log(x,y)
    this.ctx.drawImage(this.image, 0, 0, this.IMAGE_WIDTH, this.IMAGE_HEIGHT)
    this.ctx.beginPath();
    this.ctx.moveTo(this.SPOTLIGHT_X, this.SPOTLIGHT_Y);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    var xRectified = (x / evt.target.width) * this.SPACE_WIDTH //  ADJUST-
    var yRectified = (y / evt.target.height) * this.SPACE_HEIGHT // MENT
    this.coordinates = [xRectified.toFixed(2), yRectified.toFixed(2)];
    this.spotLightService.testSpotlight(this.chosenSpotlight,
      {
        x: xRectified,
        y: yRectified,
        z: 0,
      }
    ).subscribe((res) => {
      //console.log(res)
    }, (err) => {
      //console.log(err)
    })
  }
}
