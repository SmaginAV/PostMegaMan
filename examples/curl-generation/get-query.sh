curl \
  --disable \
  --globoff \
  --path-as-is \
  --request 'GET' \
  --url 'https://example.invalid/get-query?a=1&a=2&q=%D1%82%D0%B5%D1%81%D1%82&empty=' \
  --max-time '30'