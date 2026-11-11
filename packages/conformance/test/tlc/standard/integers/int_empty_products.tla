(*---
description: "[Int -> {}] and Int \\X {} are empty because Int answers isEmpty."
ref: tlc2/module/Integers.java#isEmpty
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE int_empty_products ----
EXTENDS Integers
Test == [Int -> {}] = {} /\ Int \X {} = {}
====

(*--- recorded
all:
  exit: 0
---*)
