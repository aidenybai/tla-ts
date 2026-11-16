(*---
description: "A lone carriage return ends a \\* comment, so code after it on the same physical line is parsed."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE line_comment_ends_at_carriage_return ----
\* commentTest == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
