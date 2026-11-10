(*---
description: "IF TRUE does not evaluate the ELSE branch."
ref: "tlc2/tool/impl/Tool.java#OPCODE_ite"
flags: [expression]
outcome: success
---*)
---- MODULE if_true_skips_else_error ----
EXTENDS Integers
Test == IF TRUE THEN TRUE ELSE 1 \div 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
