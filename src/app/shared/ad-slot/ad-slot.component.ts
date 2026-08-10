import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/**
 * A policy-safe reserved location for an approved advertising unit.
 * No third-party ad script is loaded until a publisher ID and ad-slot ID are configured.
 */
@Component({
  selector: 'app-ad-slot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside *ngIf="showPlaceholder" class="ad-slot" [attr.data-ad-placement]="placement" aria-label="Advertisements">
      <span>Advertisements</span>
      <small>Reserved space for an approved ad unit</small>
    </aside>
  `,
  styles: [`
    .ad-slot {
      display: grid;
      min-height: 112px;
      place-items: center;
      align-content: center;
      gap: .35rem;
      margin: 2.5rem auto;
      padding: 1rem;
      color: #74839a;
      text-align: center;
      border: 1px dashed #c9d5e5;
      border-radius: 10px;
      background: #fbfcfe;
    }
    .ad-slot span { font-size: .72rem; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
    .ad-slot small { font-size: .78rem; }
  `]
})
export class AdSlotComponent {
  /** Set to true only while checking the future slot location locally. */
  @Input() showPlaceholder = false;
  @Input() placement = 'content';
}
