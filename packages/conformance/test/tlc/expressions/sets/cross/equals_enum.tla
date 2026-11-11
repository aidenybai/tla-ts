(*---
description: "A product equals the enumerated set of its tuples."
ref: "tlc2/value/impl/SetOfTuplesValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE equals_enum ----
EXTENDS Integers
Test == {1, 2} \X {3} = {<<2, 3>>, <<1, 3>>}
====

(*--- recorded
all:
  exit: 0
---*)
