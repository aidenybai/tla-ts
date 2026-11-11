(*---
description: "A function on non-interval integers is not a tuple, and membership is FALSE."
ref: "tlc2/value/impl/SetOfTuplesValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_function_on_integers_false ----
EXTENDS Integers, TLC
Test == (2 :> 1) \notin {1} \X {2}
====

(*--- recorded
all:
  exit: 0
---*)
