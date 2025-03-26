// stop when another tab starts. Listen only once
// gotta do the click on the toggle to have it visually change.
export function cevalRestarter(): void {
  window.lishogi.storage.make('ceval.disable').listen(() => {
    const toggle = document.getElementById('analyse-toggle-ceval') as HTMLInputElement | undefined;
    if (toggle?.checked) toggle.click();
  });
}
