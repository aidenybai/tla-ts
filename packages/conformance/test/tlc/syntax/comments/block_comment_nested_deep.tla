(*---
description: "Block comments nest to any depth, each *) closing one level."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_nested_deep ----
(* 1 (* 2 (* 3 (* 4 (* 5 *) 4 *) 3 *) 2 *) 1 *)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
