(*---
description: "Dot and bracket components can mix in one path."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE nested_path_mixed ----
EXTENDS Integers
Test == [[a |-> <<[b |-> 1]>>] EXCEPT !.a[1].b = 9].a[1].b = 9
====

(*--- recorded
all:
  exit: 0
---*)
