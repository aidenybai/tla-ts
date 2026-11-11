(*---
description: "A filter nested in a quantifier sees the binding of each round."
ref: "tlc2/value/impl/SetPredValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE closure_over_quantifier_in_filter ----
EXTENDS Integers
Test == \A k \in 0..1 : (k + 1) \in {y \in Nat : y > k}
====

(*--- recorded
all:
  exit: 0
---*)
