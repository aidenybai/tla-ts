(*---
description: Evaluates a random bool expression, seed 262, number 6931.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06931 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE) <=> (Nat = {x \in 1..3 : x > 1})) => ((\A b10611 \in {x \in 1..3 : x > 1} : TRUE) => (Nat = SUBSET {1}))) /\ ([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = (0 \div 3)] = [[a |-> 7, b |-> TRUE] EXCEPT !.a = Head({})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06931 failed.
    Attempted to compare overridden value Nat with non-overridden value:
    {2, 3}
---*)
