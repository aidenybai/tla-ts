(*---
description: "A disjunction list stops at its first TRUE bullet."
ref: "tlc2/tool/impl/Tool.java#OPCODE_dl"
flags: [expression]
outcome: success
---*)
---- MODULE disj_list_true_skips_rest ----
EXTENDS Integers
Test ==
  \/ TRUE
  \/ 1 \div 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
