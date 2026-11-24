/* Icônes SVG maison : trait 1.8, coins arrondis, viewBox 24. */
(function () {
  const P = {
    cross: '<path d="M9 3.5h6v5.5h5.5v6H15v5.5H9V15H3.5V9H9z"/>',
    wave: '<path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M2 19.5c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M12 3v6M9 6h6"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/><path d="M7.5 12h2.5l1.3-2.2 1.9 4 1.3-1.8h2"/>',
    award: '<circle cx="12" cy="9" r="5.5"/><path d="M8.6 13.4 7.5 21l4.5-2.5 4.5 2.5-1.1-7.6"/><path d="m10 9 1.5 1.5L14.5 7.5"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20v-4h-4"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r="1"/><circle cx="4.8" cy="12" r="1"/><circle cx="4.8" cy="17.5" r="1"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    filter: '<path d="M4 5h16l-6.2 7.5V19l-3.6-1.8v-4.7z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.2-4 4-5.5 7.5-5.5s6.3 1.5 7.5 5.5"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c.9-3.4 3.3-5 6.5-5s5.6 1.6 6.5 5"/><path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 15.3c2 .6 3.3 2.2 4 4.7"/>',
    file: '<path d="M6 3h8l4.5 4.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h4.5M8.5 13h7M8.5 16.5h5"/>',
    upload: '<path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/>',
    download: '<path d="M12 4v11.5M7.5 11 12 15.5l4.5-4.5"/><path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8L16.2 9.6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    alert: '<path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    euro: '<path d="M17.5 6.5A6.5 6.5 0 1 0 17.5 17.5"/><path d="M4.5 10.5h9M4.5 13.5h9"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3.5"/>',
    wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16.5" height="11.5" rx="2.5"/><circle cx="16" cy="13.8" r="1.2"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12.2 2.3 2.3 4.3-4.6"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 0 1 5 .8c0 1.8-2.5 2.2-2.5 3.9"/><circle cx="12" cy="17" r=".7" fill="currentColor"/>',
    chat: '<path d="M4 5.5h16v10.5H9.5L5 20v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    send: '<path d="M21 3 10.5 13.5"/><path d="M21 3 14.5 21l-4-7.5L3 9.5z"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
    chart: '<path d="M4 20V4M4 20h16"/><rect x="7" y="12" width="3" height="5" rx=".8"/><rect x="12" y="8" width="3" height="9" rx=".8"/><rect x="17" y="5" width="3" height="12" rx=".8"/>',
    gantt: '<path d="M4 4v16h16"/><rect x="7" y="6.5" width="7" height="3" rx="1.2"/><rect x="10" y="11" width="8" height="3" rx="1.2"/><rect x="8" y="15.5" width="5" height="3" rx="1.2"/>',
    folder: '<path d="M3.5 7A2 2 0 0 1 5.5 5h4l2 2.5h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    kanban: '<rect x="3.5" y="4" width="4.5" height="16" rx="1.4"/><rect x="9.8" y="4" width="4.5" height="11" rx="1.4"/><rect x="16" y="4" width="4.5" height="7" rx="1.4"/>',
    arrowRight: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19.5 12h-15M10.5 6l-6 6 6 6"/>',
    chevronRight: '<path d="m9 5.5 6.5 6.5L9 18.5"/>',
    chevronLeft: '<path d="M15 5.5 8.5 12l6.5 6.5"/>',
    chevronDown: '<path d="m5.5 9 6.5 6.5L18.5 9"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.8 7 8.2 6 8.2-6"/>',
    whatsapp: '<path d="M4 20l1.3-4A8 8 0 1 1 8.4 19z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8a4.5 4.5 0 0 1-2.7-2.7l.8-1-1-2z"/>',
    sparkle: '<path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7z"/><path d="M19 15.5c.25 1.6 1 2.3 2.5 2.5-1.5.25-2.25 1-2.5 2.5-.25-1.5-1-2.25-2.5-2.5 1.5-.2 2.25-.9 2.5-2.5z"/>',
    server: '<rect x="4" y="4" width="16" height="6.5" rx="2"/><rect x="4" y="13.5" width="16" height="6.5" rx="2"/><path d="M8 7.2h.01M8 16.8h.01"/>',
    database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13"/><path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
    flow: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.5 6h7M7.2 8.2l3.6 7.6M16.8 8.2l-3.6 7.6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9S14.6 18.4 12 21c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    pen: '<path d="M4 20l1-4.5L16 4.5l3.5 3.5-11 11z"/><path d="m14 6.5 3.5 3.5"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5"/><path d="m8.5 13 2.3 2.3 4.7-4.8"/>',
    package: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9M8 5.2l8 4.6"/>',
    home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5.5h4V20"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".7" fill="currentColor"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
    building: '<path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V21"/><path d="M15 10h3.5A1.5 1.5 0 0 1 20 11.5V21M3 21h18"/><path d="M8 8h3M8 12h3M8 16h3"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
    graduation: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v5c1.5 1.5 3.5 2.3 5.5 2.3s4-.8 5.5-2.3v-5M21.5 9v5.5"/>',
    lifebuoy: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.6"/><path d="m6 6 3.4 3.4M18 6l-3.4 3.4M6 18l3.4-3.4M18 18l-3.4-3.4"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>',
    signature: '<path d="M3 17c2-1 3-5 4.5-5s.5 4 2.5 4 2.5-6 4.5-6 1 5 3 5 2-1 3.5-1"/><path d="M3 21h18"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    swim: '<circle cx="16.5" cy="6.5" r="2"/><path d="M3 13.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/><path d="M3 18c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/><path d="m7 11 4-4 4 3.5"/>',
    send2: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    zoomIn: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M11 8.5v5M8.5 11h5"/>',
    zoomOut: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M8.5 11h5"/>'
  };
  App.icon = function (name, cls) {
    const p = P[name] || P.info;
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>';
  };
  // Logo : croix de secours + vague
  App.logo = function (size) {
    const s = size || 40;
    return '<svg class="logo-mark" width="' + s + '" height="' + s + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<rect width="48" height="48" rx="13" fill="#0B2A4A"/>' +
      '<path d="M19.5 8h9v9.5H38v9h-9.5v1.2c-3-1.6-6-1.6-9 0V26.5H10v-9h9.5z" fill="#E5484D"/>' +
      '<path d="M6 33c3.4 0 3.4-2.6 6.8-2.6s3.4 2.6 6.8 2.6 3.4-2.6 6.8-2.6 3.4 2.6 6.8 2.6 3.4-2.6 6.8-2.6" fill="none" stroke="#12A4B6" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M6 39.5c3.4 0 3.4-2.6 6.8-2.6s3.4 2.6 6.8 2.6 3.4-2.6 6.8-2.6 3.4 2.6 6.8 2.6 3.4-2.6 6.8-2.6" fill="none" stroke="#7FD3DD" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>';
  };
})();
