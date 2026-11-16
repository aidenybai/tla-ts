(*---
description: "A function constructor may bind a tuple pattern, applied with a tuple."
ref: "tla2sany/parser/TLAplusParser.java#matchFcnConst"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE bound_tuple_function ----
Test == [<<x, y>> \in {<<1, 2>>} |-> x][<<1, 2>>] = 1
====

(*--- recorded
all:
  exit: 0
---*)
