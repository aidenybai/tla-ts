(*---
description: "(***) is an open, one star of text, and a close."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_star_run ----
(***)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
