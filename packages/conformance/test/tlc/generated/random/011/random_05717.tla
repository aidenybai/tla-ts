(*---
description: Evaluates a random set expression, seed 262, number 5717.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05717 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b8796 \in ({b8797 \in (2 .. -1) : (\A b8798 \in {} : FALSE)} \cap ((1 .. -1) \ ({1, 2} \ Nat))) : (~([[a |-> 1] EXCEPT !.a = SUBSET {1}] = [[a |-> 1] EXCEPT !.a = @ + -1]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
