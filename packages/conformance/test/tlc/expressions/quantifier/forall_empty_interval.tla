(*---
description: "\\A over an empty interval is TRUE."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bf"
flags: [expression]
outcome: success
---*)
---- MODULE forall_empty_interval ----
EXTENDS Integers
Test == \A x \in 3..1 : FALSE
====

(*--- recorded
all:
  exit: 0
---*)
