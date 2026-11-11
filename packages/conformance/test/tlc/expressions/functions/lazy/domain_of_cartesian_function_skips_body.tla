(*---
description: "A \\X domain is not Reducible, so the function stays lazy under DOMAIN."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fc"
flags: [expression]
outcome: success
---*)
---- MODULE domain_of_cartesian_function_skips_body ----
EXTENDS Integers
Test == DOMAIN [p \in {1} \X {2} |-> 1 \div 0] = {<<1, 2>>}
====

(*--- recorded
all:
  exit: 0
---*)
