import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Riddle } from './riddle';

describe('Riddle', () => {
  let component: Riddle;
  let fixture: ComponentFixture<Riddle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Riddle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Riddle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
