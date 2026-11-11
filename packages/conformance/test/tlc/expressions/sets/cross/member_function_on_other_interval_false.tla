(*---
description: "A function on an interval that is not 1..n is not a tuple, and membership is FALSE."
ref: "tlc2/value/impl/SetOfTuplesValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_function_on_other_interval_false ----
EXTENDS Integers
Test == [i \in 2..3 |-> i] \notin {2} \X {3}
====

(*--- recorded
all:
  exit: 0
---*)
