import { Injectable } from '@angular/core';

const BOOKSTORE_API = 'https://bookstore-fpze.onrender.com';
const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class BookstoreWakeService {
  private keepAliveTimer?: ReturnType<typeof setInterval>;

  wake(): void {
    fetch(`${BOOKSTORE_API}/_health`, { mode: 'no-cors' }).catch(() => {});
  }

  startKeepAlive(): void {
    this.wake();
    clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = setInterval(() => this.wake(), KEEP_ALIVE_INTERVAL);
  }

  stopKeepAlive(): void {
    clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = undefined;
  }
}
