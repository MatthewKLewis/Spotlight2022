import { Component, OnInit } from '@angular/core';
import { SpotlightService } from './spotlight.service';

@Component({
  selector: 'app-eulers',
  templateUrl: './eulers.component.html',
  styleUrls: ['./eulers.component.scss'],
})
export class EulersComponent implements OnInit {
  IMAGE_WIDTH: number = 3070; //829 Pixels Represents 6.096m.
  IMAGE_HEIGHT: number = 1410;
  // SPACE_WIDTH: number = 6.096; //And vice versa
  // SPACE_HEIGHT: number = 6.096;
  SPOTLIGHT_X: number = 2460;
  SPOTLIGHT_Y: number = 515;
  // IMAGE_HORIZONTAL_PPF: number = this.IMAGE_WIDTH / this.SPACE_WIDTH;
  // IMAGE_VERTICAL_PPF: number = this.IMAGE_HEIGHT / this.SPACE_HEIGHT;

  cnv!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  image: any = new Image(this.IMAGE_WIDTH, this.IMAGE_HEIGHT);
  chosenSpotlight: number = 0;
  coordinates: Array<string> = ['0', '0'];

  constructor(public spotLightService: SpotlightService) {}

  ngOnInit(): void {
    this.cnv = <HTMLCanvasElement>document.querySelector('#canvas');
    this.ctx = <CanvasRenderingContext2D>this.cnv.getContext('2d');
    this.image.src = '../../assets/0-0-0.png';
    this.image.onload = () => {
      this.ctx.drawImage(this.image, 0, 0, this.IMAGE_WIDTH, this.IMAGE_HEIGHT);
    };
    this.cnv.width = this.IMAGE_WIDTH;
    this.cnv.height = this.IMAGE_HEIGHT;
    this.ctx.lineWidth = 14;
    this.ctx.strokeStyle = 'rgba(255, 221, 83, 0.5)';
  }

  canvasClick(evt: any) {
    var x = evt.pageX - evt.originalTarget.offsetLeft;
    var y = evt.pageY - evt.originalTarget.offsetTop;

    // draw line
    this.ctx.drawImage(this.image, 0, 0, this.IMAGE_WIDTH, this.IMAGE_HEIGHT);
    this.ctx.beginPath();
    this.ctx.moveTo(this.SPOTLIGHT_X, this.SPOTLIGHT_Y);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    //print
    console.log(x, y);
    this.coordinates = [x.toFixed(2), y.toFixed(2)];

    //   this.spotLightService
    //     .testSpotlight(this.chosenSpotlight, {
    //       x: x,
    //       y: y,
    //       z: 0,
    //     })
    //     .subscribe(
    //       (res) => {
    //         console.log(res);
    //       },
    //       (err) => {
    //         console.log(err);
    //       }
    //     );
    //
  }
}
