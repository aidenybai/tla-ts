(*---
description: "CHOOSE with a tuple binder returns the whole element."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_returns_whole_tuple ----
EXTENDS Integers
Test == (CHOOSE <<a, b>> \in {<<2, 1>>, <<1, 2>>} : TRUE) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
