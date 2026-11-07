(*---
description: A block comment may span lines and hide definitions.
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_multiline ----
(*
Test == FALSE
*)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
