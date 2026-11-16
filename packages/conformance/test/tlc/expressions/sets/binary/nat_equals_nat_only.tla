(*---
description: "Nat equals itself and differs from Int without enumeration."
ref: "tlc2/module/Naturals.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE nat_equals_nat_only ----
EXTENDS Integers
Test == Nat = Nat /\ Nat # Int /\ Int = Int /\ STRING = STRING
====

(*--- recorded
all:
  exit: 0
---*)
