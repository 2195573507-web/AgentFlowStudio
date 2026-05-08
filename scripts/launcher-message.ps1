param(
  [Parameter(Mandatory = $true)]
  [string]$Key
)

$messages = @{
  start = 'W0FnZW50RmxvdyBTdHVkaW9dIOato+WcqOWQr+WKqOmdmeaAgeWPr+S6pOS7mOaooeW8jy4uLg=='
  path = '6aG555uu6Lev5b6E77ya'
  log = '5ZCv5Yqo5pel5b+X77ya'
  nodeMissing = 'W+mUmeivr10g5pyq5om+5YiwIE5vZGUuanPjgILor7flhYjlronoo4UgTm9kZS5qc++8jOeEtuWQjumHjeaWsOaJk+W8gOW/q+aNt+aWueW8j+OAgg=='
  serverMissing = 'W+mUmeivr10g5pyq5om+5YiwIHNjcmlwdHNcc3RhdGljLXNlcnZlci5qc+OAgg=='
  serverStart = 'W0FnZW50RmxvdyBTdHVkaW9dIOmdmeaAgeacjeWKoeWZqOato+WcqOWQr+WKqOOAguivt+S/neaMgeatpOeql+WPo+aJk+W8gOOAgg=='
  browser = 'W0FnZW50RmxvdyBTdHVkaW9dIOacjeWKoeWZqOWwsee7quWQjuS8muiHquWKqOaJk+W8gOa1j+iniOWZqOOAgg=='
  exited = 'W0FnZW50RmxvdyBTdHVkaW9dIOmdmeaAgeacjeWKoeWZqOW3sumAgOWHuu+8jOmAgOWHuuegge+8mg=='
  latest = 'LS0tLS0tLS0tLS0tLS0tLS0tIOacgOaWsOWQr+WKqOaXpeW/lyAtLS0tLS0tLS0tLS0tLS0tLS0='
}

try {
  $encoding = [System.Text.UTF8Encoding]::new($false)
  [Console]::OutputEncoding = $encoding
  if ($messages.ContainsKey($Key)) {
    [Console]::WriteLine($encoding.GetString([Convert]::FromBase64String($messages[$Key])))
  } else {
    [Console]::WriteLine($Key)
  }
} catch {
  [Console]::WriteLine($Key)
}
