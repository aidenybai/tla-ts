(*---
description: "[Nat -> {}] is empty because the range is, since Nat answers isEmpty."
ref: tlc2/module/Naturals.java#isEmpty
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE nat_empty_function_space ----
EXTENDS Naturals
Test == [Nat -> {}] = {}
====

(*--- recorded
all:
  exit: 0
---*)
