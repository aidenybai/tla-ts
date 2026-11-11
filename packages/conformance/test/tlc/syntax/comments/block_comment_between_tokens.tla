(*---
description: A block comment may sit between any two tokens.
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE block_comment_between_tokens ----
Test (* a *) == (* b *) 1 (* c *) = (* d *) 1
====

(*--- recorded
all:
  exit: 0
---*)
