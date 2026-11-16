(*---
description: Evaluates a random function expression, seed 262, number 667.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00667 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1111 \in {b1112 \in (CHOOSE f \in [2..1 -> {1, 2} \ {1}] : TRUE) : (~(FALSE \/ TRUE))} |-> ((Cardinality({1, 2}) + (b1111 + 7)) .. Head(SelectSeq(<<1>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b1111 \\in {b1112 \\in <<>> : <expression line 14, col 86 to line 14, col 101 of module random_00667> } |-> <expression line 14, col 110 to line 14, col 188 of module random_00667>]"
---*)
