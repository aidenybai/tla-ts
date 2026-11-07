(*---
description: "The branches of IF need not have comparable types when only one is taken."
ref: "tlc2/tool/impl/Tool.java#OPCODE_ite"
flags: [expression]
outcome: success
---*)
---- MODULE if_branches_may_differ_in_type ----
EXTENDS Integers
Test == (IF TRUE THEN 1 ELSE "a") = 1 /\ (IF FALSE THEN 1 ELSE "a") = "a"
====

(*--- recorded
all:
  exit: 0
---*)
