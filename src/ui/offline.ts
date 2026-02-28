/** Initialise the online/offline status banner. */
export function initOfflineBanner(): void {
  const banner = document.getElementById("offline-banner");
  if (!banner) return;

  function update(): void {
    if (navigator.onLine) {
      banner!.setAttribute("hidden", "");
    } else {
      banner!.removeAttribute("hidden");
    }
  }

  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  // Set the correct initial state
  update();
}
