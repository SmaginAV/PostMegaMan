curl \
  --disable \
  --globoff \
  --path-as-is \
  --request 'POST' \
  --url 'https://example.invalid/complex' \
  --max-time '30' \
  --header 'X-Empty;' \
  --header 'X-Quote: O'\''Connor \" $(literal); & | > `test`' \
  --header 'Content-Type: application/json' \
  --data-raw '{
	"name": "O'\''Connor", "quote": "\"", "path": "C:\\tmp",
	"literal": "$(touch SHOULD_NOT_EXIST); `touch SHOULD_NOT_EXIST` | & > < $name",
	"unicode": "Привет мир"
}'