(*---
description: "[Seq({1}) -> {}] is empty: Seq answers that it is not empty and has no check to fail."
ref: tlc2/module/Sequences.java#isEmpty
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_is_not_empty_function_set ----
EXTENDS Sequences, Naturals
Test == [Seq({1}) -> {}] = {}
====

(*--- recorded
all:
  exit: 0
---*)
