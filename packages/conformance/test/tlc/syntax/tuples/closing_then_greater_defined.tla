(*---
description: "<<1>>>2 reads >> first, then > applied to the tuple."
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE closing_then_greater_defined ----
a > b == a
Test == (<<1>>>2) = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
