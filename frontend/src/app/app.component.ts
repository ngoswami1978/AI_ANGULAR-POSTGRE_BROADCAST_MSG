import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Message = { id: number; content: string; created_at: string };
type EventMessage = { type: 'message'; data: Message };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main style="max-width: 760px; margin: 2rem auto; font-family: Arial, sans-serif;">
      <h1>Broadcast Messages</h1>
      <p style="color:#666">Mode: Angular-only backend (in-browser)</p>

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
  error = '';
  messages: Message[] = [];

  private readonly storageKey = 'angular_backend_messages';
  private readonly channel = new BroadcastChannel('angular_backend_channel');

  constructor() {
    this.messages = this.loadMessages();

    this.channel.onmessage = (event: MessageEvent<EventMessage>) => {
      const payload = event.data;
      if (payload?.type === 'message') {
        this.messages = [payload.data, ...this.messages.filter((m) => m.id !== payload.data.id)];
      }
    };
  }

  ngOnDestroy(): void {
    this.channel.close();
  }

  send(): void {
    const content = this.draft.trim();
    if (!content) return;

    this.sending = true;
    this.error = '';

    try {
      const next = this.createMessage(content);
      this.messages = [next, ...this.messages];
      this.persistMessages(this.messages);
      this.channel.postMessage({ type: 'message', data: next } satisfies EventMessage);
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

  private loadMessages(): Message[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Message[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persistMessages(messages: Message[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(messages.slice(0, 100)));
  }

  private createMessage(content: string): Message {
    const maxId = this.messages.reduce((acc, msg) => Math.max(acc, msg.id), 0);
    return {
      id: maxId + 1,
      content,
      created_at: new Date().toISOString()
    };
  }
}
