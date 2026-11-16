(*---
description: "IF can select the function that a later application uses, and the function kept lazily is not fully evaluated."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: success
---*)
---- MODULE if_returning_set_is_lazy_in_application ----
EXTENDS Integers
Test == (IF TRUE THEN [x \in 1..2 |-> IF x = 1 THEN 7 ELSE 1 \div 0] ELSE 0)[1] = 7
====

(*--- recorded
all:
  exit: 0
---*)
