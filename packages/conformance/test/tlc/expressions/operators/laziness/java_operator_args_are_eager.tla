(*---
description: "A built-in Java module operator evaluates every argument first."
ref: "tlc2/value/impl/MethodValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE java_operator_args_are_eager ----
EXTENDS Integers, Sequences
Test == (LET g == <<1, 2>> IN Head(g)) = 1
====

(*--- recorded
all:
  exit: 0
---*)
