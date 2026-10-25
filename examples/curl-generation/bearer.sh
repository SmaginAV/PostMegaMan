curl \
  --disable \
  --globoff \
  --path-as-is \
  --request 'GET' \
  --url 'https://example.invalid/bearer' \
  --max-time '30' \
  --header 'Authorization: Bearer demo-bearer-token'