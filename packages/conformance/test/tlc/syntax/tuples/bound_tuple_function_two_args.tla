(*---
description: "A one-pattern function may be applied with two arguments, which form the tuple."
ref: "tla2sany/semantic/Generator.java#generateExpressionOrLAP"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE bound_tuple_function_two_args ----
Test == [<<x, y>> \in {<<1, 2>>} |-> x][1, 2] = 1
====

(*--- recorded
all:
  exit: 0
---*)
