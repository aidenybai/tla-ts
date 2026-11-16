(*---
description: "(* inside a block comment nests, so the first *) does not end the comment."
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_nested_one_level ----
(* outer (* inner *) Test == FALSE *)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
