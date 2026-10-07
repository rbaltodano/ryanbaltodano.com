(function () {
  var form = document.getElementById('bug-report-form');
  var note = document.getElementById('report-note');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var description = String(data.get('description') || '').trim();
    if (!description) return;

    var steps = String(data.get('steps') || '').trim() || 'Not provided';
    var replyTo = String(data.get('replyTo') || '').trim() || 'Not provided';
    var body = [
      'What happened:', description,
      '', 'Steps to reproduce:', steps,
      '', 'Reply-to email (optional):', replyTo
    ].join('\n');

    var mailto = 'mailto:bugreport@angrove.app?subject=' +
      encodeURIComponent('Angrove bug report') + '&body=' + encodeURIComponent(body);
    note.textContent = 'Your email app should open with the report filled in. Nothing is sent until you review it and tap Send.';
    window.location.href = mailto;
  });
}());
