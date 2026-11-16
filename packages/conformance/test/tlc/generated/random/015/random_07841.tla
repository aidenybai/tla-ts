(*---
description: Evaluates a random record expression, seed 262, number 7841.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07841 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = (-1 \in {1, 2})] EXCEPT !.a = @ + (Cardinality(3) - ([a |-> 1] = [x \in 1..2 |-> x]))] EXCEPT !.a = @ + (((Nat = {1, 2}) \/ (FALSE <=> TRUE)) => ((\E b12114 \in <<1>> : FALSE) /\ (TRUE /\ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07841 failed.
    2181:0 Attempted to compute cardinality of the value
    3
---*)
