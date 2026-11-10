(*---
description: "Nat is equal to itself inside a set."
ref: "tlc2/module/Naturals.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE two_nats_collapse ----
EXTENDS Integers, FiniteSets
Test == Cardinality({Nat, Nat, Int}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
