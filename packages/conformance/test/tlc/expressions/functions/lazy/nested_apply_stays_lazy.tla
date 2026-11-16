(*---
description: "KeepLazy applies through a chain of applications."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: success
---*)
---- MODULE nested_apply_stays_lazy ----
EXTENDS Integers
Test == [x \in 1..2 |-> IF x = 1 THEN [y \in 1..2 |-> IF y = 1 THEN 7 ELSE 1 \div 0] ELSE 1 \div 0][1][1] = 7
====

(*--- recorded
all:
  exit: 0
---*)
