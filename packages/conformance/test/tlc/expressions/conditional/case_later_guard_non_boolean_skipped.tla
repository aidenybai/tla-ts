(*---
description: "CASE does not type check the guards after the first true one."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: success
---*)
---- MODULE case_later_guard_non_boolean_skipped ----
EXTENDS Integers
Test == (CASE TRUE -> 1 [] 3 -> 2) = 1
====

(*--- recorded
all:
  exit: 0
---*)
