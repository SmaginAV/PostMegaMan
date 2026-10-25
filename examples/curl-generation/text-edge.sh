curl \
  --disable \
  --globoff \
  --path-as-is \
  --request 'POST' \
  --url 'https://example.invalid/leading-at' \
  --max-time '30' \
  --header 'Content-Type:' \
  --data-raw '@SHOULD_NOT_BE_READ.txt
Second line'