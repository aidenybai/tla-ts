(*---
description: A comment may sit on either side of the record dot.
ref: "tla2sany/parser/TLAplusParserTokenManager.java#SkipLexicalActions"
features: [comments]
flags: [expression]
outcome: success
---*)
---- MODULE comment_inside_record_dot ----
Test == [a |-> 1] (* c *) . (* d *) a = 1
====

(*--- recorded
all:
  exit: 0
---*)
