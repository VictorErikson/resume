import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TrackerService {
  static getTrackingScript(siteId: number, trackerUrl: string): string {
    return (
      `(function(w,d,s,o){w.mtr=w.mtr||function(){(w.mtr.q=w.mtr.q||[]).push(arguments)};` +
      `var t=d.createElement(s);t.async=1;t.src='${trackerUrl}/mtr.js?id=${siteId}';` +
      `var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(t,f)})(window,document,'script');`
    );
  }
}
