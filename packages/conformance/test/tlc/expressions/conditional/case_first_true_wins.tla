(*---
description: "CASE picks the first true guard in source order, so overlapping guards behave deterministically."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: success
---*)
---- MODULE case_first_true_wins ----
EXTENDS Integers
Test == (CASE TRUE -> 1 [] TRUE -> 2) = 1
====

(*--- recorded
all:
  exit: 0
---*)
