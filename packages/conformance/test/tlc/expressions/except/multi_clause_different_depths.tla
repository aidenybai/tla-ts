(*---
description: "Clauses can have paths of different depths, applied in order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE multi_clause_different_depths ----
EXTENDS Integers
Test == [<<<<1>>, 2>> EXCEPT ![1][1] = 7, ![2] = 8] = <<<<7>>, 8>>
====

(*--- recorded
all:
  exit: 0
---*)
