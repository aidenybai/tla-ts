(*---
description: "A conjunction list does not type check the bullets after a FALSE one."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cl"
flags: [expression]
outcome: success
---*)
---- MODULE conj_list_false_skips_non_boolean ----
EXTENDS Integers
Conj ==
  /\ FALSE
  /\ 7
Test == ~Conj
====

(*--- recorded
all:
  exit: 0
---*)
