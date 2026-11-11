(*---
description: A space after < lets the following << open a tuple.
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE less_with_space_then_opening ----
EXTENDS Naturals
Test == 1 < <<2>>[1]
====

(*--- recorded
all:
  exit: 0
---*)
