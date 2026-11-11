(*---
description: "*) inside a \\* comment is ignored, so it does not close anything."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE line_comment_hides_block_close ----
\* *) ) ) ]]
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
