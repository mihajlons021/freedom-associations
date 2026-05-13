<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Associations</title>
    <script>
      window.onerror = function(msg, src, line, col, err) {
        document.body.style.background = '#fff';
        document.body.style.color = '#000';
        document.body.style.padding = '20px';
        document.body.style.fontSize = '14px';
        document.body.innerHTML = '<b>ERROR:</b><br>' + msg + '<br><br>Line: ' + line + '<br><br>' + (err ? err.stack : 'no stack');
        return false;
      };
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>