(*---
description: "[x, y \\in S |-> e] has domain S \\X S."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fc"
flags: [expression]
outcome: success
---*)
---- MODULE shared_bound ----
EXTENDS Integers
Test == DOMAIN [x, y \in {1, 2} |-> 0] = {1, 2} \X {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
