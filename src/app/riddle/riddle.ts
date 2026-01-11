import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-riddle',
  imports: [],
  templateUrl: './riddle.html',
  styleUrl: './riddle.css',
})
export class Riddle {
  @Input() sample!: ExtendedSampleMetadata;
}
