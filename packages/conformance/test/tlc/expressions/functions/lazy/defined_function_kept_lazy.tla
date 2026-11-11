(*---
description: "Applying a function named by a definition is lazy, and the failed startup evaluation of the definition is not reported."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: success
---*)
---- MODULE defined_function_kept_lazy ----
EXTENDS Integers
F == [x \in 1..2 |-> IF x = 1 THEN 7 ELSE 1 \div 0]
Test == F[1] = 7
====

(*--- recorded
all:
  exit: 0
---*)
