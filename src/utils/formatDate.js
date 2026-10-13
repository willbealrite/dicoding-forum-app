function formatDate(dateString) {
  if (!dateString) return 'Waktu tidak tersedia';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Waktu tidak tersedia';
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default formatDate;
