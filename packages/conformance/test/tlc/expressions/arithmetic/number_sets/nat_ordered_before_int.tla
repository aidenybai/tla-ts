(*---
description: "Nat sorts before Int in the value order."
ref: "tlc2/module/Naturals.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE nat_ordered_before_int ----
EXTENDS Integers
Test == (CHOOSE s \in {Int, Nat} : TRUE) = Nat
====

(*--- recorded
all:
  exit: 0
---*)
