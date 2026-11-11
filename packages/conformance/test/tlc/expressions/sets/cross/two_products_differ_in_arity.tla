(*---
description: "Products of different arity are unequal."
ref: "tlc2/value/impl/SetOfTuplesValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE two_products_differ_in_arity ----
EXTENDS Integers
Test == {1} \X {2} # {1} \X {2} \X {3}
====

(*--- recorded
all:
  exit: 0
---*)
