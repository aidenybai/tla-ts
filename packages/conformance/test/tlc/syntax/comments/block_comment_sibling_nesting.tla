(*---
description: Two sibling nested comments inside one block return to depth one between them.
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_sibling_nesting ----
(* a (* b *) Test == FALSE (* c *) d *)
Test == TRUE
====

(*--- recorded
all:
  exit: 0
---*)
