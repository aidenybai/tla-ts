(*---
description: "Application chains through EXCEPT results."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: success
---*)
---- MODULE apply_after_except_chain ----
EXTENDS Integers
Test == [[x \in 1..2 |-> x] EXCEPT ![1] = 9][1] = 9
====

(*--- recorded
all:
  exit: 0
---*)
