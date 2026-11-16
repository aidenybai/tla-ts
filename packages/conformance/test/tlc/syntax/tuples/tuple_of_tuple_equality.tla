(*---
description: Tuples compare element by element after parsing.
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE tuple_of_tuple_equality ----
Test == <<1, <<2>>>> = <<1, <<2>>>>
====

(*--- recorded
all:
  exit: 0
---*)
