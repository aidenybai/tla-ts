(*---
description: A comment may split << and the first element.
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE comment_inside_tuple_brackets ----
Test == << (* c *) 1 (* d *) , \* e
           2 >>[2] = 2
====

(*--- recorded
all:
  exit: 0
---*)
