
async function main() {
  const r = await fetch('http://localhost:3000/', {
    headers: { Host: 'salem.localhost:3000' }
  });
  const html = await r.text();
  console.log('Status:', r.status);
  
  // Find data-theme-id
  const themeMatch = html.match(/data-theme-id="([^"]+)"/);
  console.log('data-theme-id:', themeMatch ? themeMatch[1] : 'NOT FOUND');

  // Find theme- root class
  const classMatch = html.match(/theme-([a-z0-9_-]+)/);
  console.log('theme class:', classMatch ? classMatch[0] : 'NOT FOUND');

  // Check texts
  console.log('Has Sweet Moments:', html.includes('Sweet Moments'));
  console.log('Has DESSERTS & CAFÉ:', html.includes('DESSERTS &amp; CAFÉ') || html.includes('DESSERTS & CAFÉ'));
  console.log('Has Sweet Indulgence:', html.includes('Sweet Indulgence:'));
  console.log('Has Categories:', html.includes('Categories'));
  console.log('Has #E86BA3:', html.includes('#E86BA3'));
  console.log('Has Heart button aria-label Like:', html.includes('aria-label="Like"'));
}

main().catch(console.error);
