(*---
description: "A disjunction list does not type check the bullets after a TRUE one."
ref: "tlc2/tool/impl/Tool.java#OPCODE_dl"
flags: [expression]
outcome: success
---*)
---- MODULE disj_list_true_skips_non_boolean ----
EXTENDS Integers
Test ==
  \/ TRUE
  \/ 7
====

(*--- recorded
all:
  exit: 0
---*)
