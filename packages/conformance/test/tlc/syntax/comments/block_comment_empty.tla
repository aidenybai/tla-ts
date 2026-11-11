(*---
description: "(**) is an open and a close with nothing between."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_empty ----
(**)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
