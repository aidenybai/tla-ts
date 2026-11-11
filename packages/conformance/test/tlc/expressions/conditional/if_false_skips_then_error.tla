(*---
description: "IF FALSE does not evaluate the THEN branch."
ref: "tlc2/tool/impl/Tool.java#OPCODE_ite"
flags: [expression]
outcome: success
---*)
---- MODULE if_false_skips_then_error ----
EXTENDS Integers
Test == IF FALSE THEN 1 \div 0 = 0 ELSE TRUE
====

(*--- recorded
all:
  exit: 0
---*)
