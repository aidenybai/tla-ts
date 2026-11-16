(*---
description: "CASE takes OTHER when every guard is false."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: success
---*)
---- MODULE case_other_taken ----
EXTENDS Integers
Test == (CASE FALSE -> 1 [] FALSE -> 2 [] OTHER -> 3) = 3
====

(*--- recorded
all:
  exit: 0
---*)
