(*---
description: "= between two products compares components, so products over Nat are equal without enumeration."
ref: "tlc2/value/impl/SetOfTuplesValue.java#equals"
flags: [expression]
outcome: success
---*)
---- MODULE two_products_compare_by_components ----
EXTENDS Integers
Test == Nat \X Nat = Nat \X Nat
====

(*--- recorded
all:
  exit: 0
---*)
