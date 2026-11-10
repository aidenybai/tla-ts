(*---
description: "A coarser clause after a deeper one replaces its result."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE fine_clause_then_coarse ----
EXTENDS Integers
Test == [<<<<1, 2>>>> EXCEPT ![1][2] = 9, ![1] = <<3, 4>>] = <<<<3, 4>>>>
====

(*--- recorded
all:
  exit: 0
---*)
