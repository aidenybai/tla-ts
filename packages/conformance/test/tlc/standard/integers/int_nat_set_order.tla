(*---
description: Normalization puts Nat before Int because Naturals.compareTo returns -1 against Integers.
ref: tlc2/module/Integers.java#compareTo
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE int_nat_set_order ----
EXTENDS Integers, TLC
Test == PrintT({Int, Nat})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {Nat, Int}"
---*)
