(*---
description: "A propositional tautology checks by enumerating BOOLEAN."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bf"
flags: [expression]
outcome: success
---*)
---- MODULE quantified_over_boolean_formula ----
EXTENDS Integers
Test == \A p, q \in BOOLEAN : (p => q) <=> (~p \/ q)
====

(*--- recorded
all:
  exit: 0
---*)
