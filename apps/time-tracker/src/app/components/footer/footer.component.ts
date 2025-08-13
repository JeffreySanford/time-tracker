import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false
})
export class FooterComponent {
  @Input() isConnected = true;
  @Input() pingTime: number | null = null;

  @Output() pingServer = new EventEmitter<void>();

  onPingServer(): void {
    this.pingServer.emit();
  }
}
