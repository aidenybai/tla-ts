(*---
description: "S \\X S equals [1..2 -> S], across representations."
ref: "tlc2/value/impl/SetOfTuplesValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equals_function_set ----
EXTENDS Integers
Test == {0, 1} \X {0, 1} = [1..2 -> {0, 1}]
====

(*--- recorded
all:
  exit: 0
---*)
