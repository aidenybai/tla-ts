(*---
description: "A conjunction list stops at its first FALSE bullet."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cl"
flags: [expression]
outcome: success
---*)
---- MODULE conj_list_false_skips_rest ----
EXTENDS Integers
Conj ==
  /\ FALSE
  /\ 1 \div 0 = 0
Test == ~Conj
====

(*--- recorded
all:
  exit: 0
---*)
