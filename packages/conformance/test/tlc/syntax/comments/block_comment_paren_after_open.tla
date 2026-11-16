(*---
description: "(*) does not close the comment it opened: the ) is comment text."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_paren_after_open ----
(*) Test == FALSE *)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
