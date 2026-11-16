(*---
description: "A \\* comment runs to the end of the line and the next line is code."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE line_comment_ends_at_newline ----
\* Test == FALSE
Test == TRUE \* /\ FALSE
====

(*--- recorded
all:
  exit: 0
---*)
