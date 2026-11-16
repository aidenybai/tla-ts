(*---
description: "UNION {Nat} answers membership through Nat."
ref: "tlc2/value/impl/UnionValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_through_nat ----
EXTENDS Integers
Test == 1 \in UNION {Nat} /\ -1 \notin UNION {Nat}
====

(*--- recorded
all:
  exit: 0
---*)
