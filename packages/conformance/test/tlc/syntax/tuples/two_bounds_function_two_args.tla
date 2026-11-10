(*---
description: A two-bound function may be applied with two arguments.
ref: "tla2sany/semantic/Generator.java#generateExpressionOrLAP"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE two_bounds_function_two_args ----
Test == [x \in {1}, y \in {2} |-> x][1, 2] = 1
====

(*--- recorded
all:
  exit: 0
---*)
