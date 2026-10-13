function stripHtml(html) {
  if (!html) return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

export default stripHtml;
