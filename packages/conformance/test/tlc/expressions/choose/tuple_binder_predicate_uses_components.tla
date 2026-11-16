(*---
description: "CHOOSE with a tuple binder evaluates the predicate over the components."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_predicate_uses_components ----
EXTENDS Integers
Test == (CHOOSE <<a, b>> \in {<<1, 2>>, <<2, 1>>} : a > b) = <<2, 1>>
====

(*--- recorded
all:
  exit: 0
---*)
