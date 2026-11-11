(*---
description: "A \\* comment followed by CRLF ends at the CR and the LF is whitespace."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE line_comment_crlf ----
\* comment
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
