(*---
description: "EXCEPT returns a new value and leaves the original unchanged."
ref: "tlc2/value/impl/RecordValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE original_not_mutated ----
EXTENDS Integers
R == [a |-> 1]
Test == [R EXCEPT !.a = 2].a = 2 /\ R.a = 1
====

(*--- recorded
all:
  exit: 0
---*)
