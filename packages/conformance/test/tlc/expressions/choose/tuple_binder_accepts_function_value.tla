(*---
description: "Unlike a quantifier, CHOOSE with a tuple binder converts a function whose domain is 1..2 to a tuple."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_accepts_function_value ----
EXTENDS Integers
Test == (CHOOSE <<a, b>> \in {[i \in 1..2 |-> i * 5]} : a = 5) = <<5, 10>>
====

(*--- recorded
all:
  exit: 0
---*)
