(*---
description: "A quote inside a block comment does not start a string, so an unbalanced quote is fine."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_string_is_text ----
(* " *)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
