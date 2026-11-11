(*---
description: "A domain of SUBSET is not Reducible, so the function stays lazy under DOMAIN although the domain is finite."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fc"
flags: [expression]
outcome: success
---*)
---- MODULE domain_of_subset_function_skips_body ----
EXTENDS Integers
Test == DOMAIN [x \in SUBSET {1} |-> 1 \div 0] = {{}, {1}}
====

(*--- recorded
all:
  exit: 0
---*)
