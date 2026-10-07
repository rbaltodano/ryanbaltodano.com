(function () {
  var form = document.getElementById('bug-report-form');
  var note = document.getElementById('report-note');
  if (!form || !note) return;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    var button = form.querySelector('[type="submit"]');
    var originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending…';
    note.textContent = 'Sending your report…';

    try {
      var response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Submission failed');

      form.reset();
      note.textContent = 'Thanks. Your bug report was sent to the Angrove team.';
      button.textContent = 'Report sent';
    } catch (error) {
      note.textContent = 'We couldn’t send your report. Please try again, or email bugreport@angrove.app directly.';
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
}());
