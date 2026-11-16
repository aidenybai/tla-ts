(*---
description: "A chain of IF ... ELSE IF picks the first true condition."
ref: "tlc2/tool/impl/Tool.java#OPCODE_ite"
flags: [expression]
outcome: success
---*)
---- MODULE if_nested_else_chain ----
EXTENDS Integers
Test == (IF FALSE THEN 1 ELSE IF TRUE THEN 2 ELSE IF TRUE THEN 3 ELSE 4) = 2
====

(*--- recorded
all:
  exit: 0
---*)
