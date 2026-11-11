(*---
description: "A constructor passed as an operator argument is evaluated with the caller control of the application."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: success
---*)
---- MODULE parameter_function_kept_lazy ----
EXTENDS Integers
Get(f) == f[1]
Test == Get([x \in 1..2 |-> IF x = 1 THEN 7 ELSE 1 \div 0]) = 7
====

(*--- recorded
all:
  exit: 0
---*)
