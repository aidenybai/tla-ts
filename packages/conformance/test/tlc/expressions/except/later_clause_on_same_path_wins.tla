(*---
description: "A later clause on the same path overwrites an earlier one."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE later_clause_on_same_path_wins ----
EXTENDS Integers
Test == [<<0>> EXCEPT ![1] = 1, ![1] = 2] = <<2>>
====

(*--- recorded
all:
  exit: 0
---*)
