(*---
description: "Membership in a lazy filter checks the bound set first, so the erroring predicate does not run for an element outside it."
ref: "tlc2/value/impl/SetPredValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_member_outer_set_first ----
EXTENDS Integers
Test == -1 \notin {x \in Nat : 1 \div 0 = x}
====

(*--- recorded
all:
  exit: 0
---*)
