(*---
description: "(* inside a \\* comment does not open a block comment."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE line_comment_hides_block_open ----
\* (* this never opens
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
