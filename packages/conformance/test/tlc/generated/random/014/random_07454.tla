(*---
description: Evaluates a random record expression, seed 262, number 7454.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07454 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE f \in [{} -> 2..1] : TRUE))[(CHOOSE b11494 \in (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) : (FALSE /\ TRUE))], b |-> ((\A b11495 \in (7 .. 2) : (FALSE /\ {1, 2})) /\ ((2 + 0) \in DOMAIN [x \in 1..2 |-> x]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07454 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 61 to line 14, col 139 of module random_07454
---*)
