(*---
description: "S \\cup T with only T Reducible asks T to do the union, so the string is found before Nat is consulted."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cup"
flags: [expression]
outcome: success
---*)
---- MODULE cup_nat_swaps_reducible_first ----
EXTENDS Integers
Test == "a" \in (Nat \cup {"a"})
====

(*--- recorded
all:
  exit: 0
---*)
