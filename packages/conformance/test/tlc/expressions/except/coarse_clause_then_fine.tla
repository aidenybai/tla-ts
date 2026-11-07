(*---
description: "A deeper clause applies on top of a coarser clause that came first."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE coarse_clause_then_fine ----
EXTENDS Integers
Test == [<<<<1, 2>>>> EXCEPT ![1] = <<3, 4>>, ![1][2] = 9] = <<<<3, 9>>>>
====

(*--- recorded
all:
  exit: 0
---*)
