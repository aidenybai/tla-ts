(*---
description: "A comment may separate two >> tokens."
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE tuple_with_comment_between_closers ----
Test == <<<<1>> (* c *) >>[1][1] = 1
====

(*--- recorded
all:
  exit: 0
---*)
