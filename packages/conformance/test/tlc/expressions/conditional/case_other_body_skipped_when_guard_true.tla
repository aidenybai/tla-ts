(*---
description: "CASE does not evaluate OTHER when a guard is true."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: success
---*)
---- MODULE case_other_body_skipped_when_guard_true ----
EXTENDS Integers
Test == (CASE TRUE -> 1 [] OTHER -> 1 \div 0) = 1
====

(*--- recorded
all:
  exit: 0
---*)
