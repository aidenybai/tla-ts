(*---
description: PrintT(Nat) prints Nat.
ref: tlc2/module/Naturals.java#toString
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE nat_prints_name ----
EXTENDS Naturals, TLC
Test == PrintT(Nat)
====

(*--- recorded
all:
  exit: 0
  transcript: "| Nat"
---*)
