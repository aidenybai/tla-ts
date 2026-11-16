(*---
description: "\\A over the empty set is TRUE and never evaluates its body."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bf"
flags: [expression]
outcome: success
---*)
---- MODULE forall_empty_skips_body_error ----
EXTENDS Integers
Test == \A x \in {} : 1 \div 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
