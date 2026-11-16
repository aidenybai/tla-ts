(*---
description: "\\* inside a block comment is text, so it does not hide the *) on its line."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_line_comment_is_text ----
(* \* *) Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
