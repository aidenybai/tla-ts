(*---
description: Int and Nat compare unequal without error in either order.
ref: tlc2/module/Integers.java#compareTo
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE int_differs_from_nat ----
EXTENDS Integers
Test == Int # Nat /\ Nat # Int
====

(*--- recorded
all:
  exit: 0
---*)
