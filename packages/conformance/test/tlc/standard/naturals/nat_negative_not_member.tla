(*---
description: A negative integer is not in Nat.
ref: tlc2/module/Naturals.java#member
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE nat_negative_not_member ----
EXTENDS Naturals
Test == (0 - 1) \notin Nat
====

(*--- recorded
all:
  exit: 0
---*)
