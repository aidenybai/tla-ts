(*---
description: "<<>> is the empty tuple."
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE empty_no_space ----
Test == <<>> = << >>
====

(*--- recorded
all:
  exit: 0
---*)
