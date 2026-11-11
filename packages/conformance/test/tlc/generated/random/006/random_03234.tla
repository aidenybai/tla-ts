(*---
description: Evaluates a random function expression, seed 262, number 3234.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03234 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE) @@ [b5134 \in (DOMAIN <<5, 6>> \cap (2147483647 .. 2147483647)) |-> Len(SelectSeq(<<>>, LAMBDA e : e > 0))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
