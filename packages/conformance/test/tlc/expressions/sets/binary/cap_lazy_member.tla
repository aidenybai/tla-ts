(*---
description: "\\cap of two non-Reducible sets is lazy, and membership requires both."
ref: "tlc2/value/impl/SetCapValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE cap_lazy_member ----
EXTENDS Integers
Test == 1 \in (Nat \cap Int) /\ -1 \notin (Nat \cap Int)
====

(*--- recorded
all:
  exit: 0
---*)
