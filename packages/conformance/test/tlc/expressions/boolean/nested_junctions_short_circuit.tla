(*---
description: "Short-circuiting applies at every level of nested junction lists."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cl"
flags: [expression]
outcome: success
---*)
---- MODULE nested_junctions_short_circuit ----
EXTENDS Integers
Test ==
  /\ \/ TRUE
     \/ 1 \div 0 = 0
  /\ \/ /\ FALSE
        /\ 7
     \/ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
