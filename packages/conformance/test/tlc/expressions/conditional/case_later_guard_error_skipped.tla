(*---
description: "CASE does not evaluate the guards after the first true one."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: success
---*)
---- MODULE case_later_guard_error_skipped ----
EXTENDS Integers
Test == (CASE TRUE -> 1 [] 1 \div 0 = 0 -> 2) = 1
====

(*--- recorded
all:
  exit: 0
---*)
