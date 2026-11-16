(*---
description: Evaluates a random bool expression, seed 262, number 2951.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02951 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\A b4677 \in ({} \cap SUBSET {1}) : (~FALSE)) /\ ((3 \in {x \in 1..3 : x > 1}) /\ (\E b4678 \in {} : TRUE))) <=> (((TRUE /\ FALSE) \/ (3 % 2147483647)) \/ ([[a |-> 1] EXCEPT !.a = @ + 7] = (CHOOSE r \in [a : {1}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02951 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    an integer.
    line 14, col 134 to line 14, col 168 of module random_02951
---*)
