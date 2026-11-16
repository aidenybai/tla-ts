(*---
description: "A LET-bound function reached through application keeps lazy, so only the applied point runs."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: success
---*)
---- MODULE let_function_kept_lazy_when_applied ----
EXTENDS Integers
Test == LET f == [x \in 1..2 |-> IF x = 1 THEN 7 ELSE 1 \div 0] IN f[1] = 7
====

(*--- recorded
all:
  exit: 0
---*)
