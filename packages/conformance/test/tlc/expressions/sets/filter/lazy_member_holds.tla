(*---
description: "Membership in a lazy filter needs both the bound and the predicate to hold."
ref: "tlc2/value/impl/SetPredValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_member_holds ----
EXTENDS Integers
Test == 2 \in {x \in Nat : x > 1} /\ 1 \notin {x \in Nat : x > 1}
====

(*--- recorded
all:
  exit: 0
---*)
