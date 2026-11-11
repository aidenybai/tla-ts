(*---
description: "f[e] evaluates a constructor with KeepLazy, so a body that fails on another argument is not run."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: success
---*)
---- MODULE apply_keeps_constructor_lazy ----
EXTENDS Integers
Test == [x \in 1..2 |-> IF x = 1 THEN 7 ELSE 1 \div 0][1] = 7
====

(*--- recorded
all:
  exit: 0
---*)
