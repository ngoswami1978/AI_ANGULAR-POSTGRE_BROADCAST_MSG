import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Message = { id: number; content: string; created_at: string };

type EventMessage =
  | { type: 'connected' }
  | { type: 'message'; data: Message }
  | { type: 'error'; message: string };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main style="max-width: 760px; margin: 2rem auto; font-family: Arial, sans-serif;">
      <h1>Broadcast Messages</h1>
      <p style="color:#666">Connection: {{ connected ? 'online' : 'offline' }}</p>

      <form (ngSubmit)="send()" style="display:flex; gap:.5rem; margin-bottom:1rem;">
        <input [(ngModel)]="draft" name="draft" placeholder="Type message" style="flex:1; padding:.5rem;" />
        <button type="submit" [disabled]="sending">{{ sending ? 'Sending...' : 'Send' }}</button>
      </form>

      <p *ngIf="error" style="color:#b00020">{{ error }}</p>

      <ul>
        <li *ngFor="let msg of messages">
          <strong>#{{ msg.id }}</strong> {{ msg.content }}
          <small style="color:#666; margin-left:.5rem;">{{ formatDate(msg.created_at) }}</small>
        </li>
      </ul>
    </main>
  `
})
export class AppComponent implements OnDestroy {
  draft = '';
  sending = false;
  connected = false;
  error = '';
  messages: Message[] = [];
  private socket: WebSocket;

  constructor() {
    this.socket = new WebSocket('ws://localhost:3000/ws');

    fetch('http://localhost:3000/messages')
      .then((res) => res.json())
      .then((rows: Message[]) => {
        this.messages = rows;
      })
      .catch(() => {
        this.error = 'Could not load messages from backend.';
      });

    this.socket.onopen = () => {
      this.connected = true;
      this.error = '';
    };

    this.socket.onclose = () => {
      this.connected = false;
    };

    this.socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as EventMessage;
      if (payload.type === 'message') {
        this.messages = [payload.data, ...this.messages];
      }
      if (payload.type === 'error') {
        this.error = payload.message;
      }
    };
  }

  ngOnDestroy(): void {
    this.socket.close();
  }

  async send(): Promise<void> {
    const content = this.draft.trim();
    if (!content) return;

    this.sending = true;
    this.error = '';

    try {
      if (this.connected) {
        this.socket.send(JSON.stringify({ content }));
      } else {
        await fetch('http://localhost:3000/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
      }
      this.draft = '';
    } catch {
      this.error = 'Message was not sent.';
    } finally {
      this.sending = false;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}
