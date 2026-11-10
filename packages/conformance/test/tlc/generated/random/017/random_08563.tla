(*---
description: Evaluates a random record expression, seed 262, number 8563.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08563 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b13268 \in DOMAIN (CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE) : ((FALSE /\ FALSE) <=> (2..1 \ SUBSET {1}))), b |-> ((-(CHOOSE b13269 \in <<>> : TRUE)) \in {b13270 \in <<7, 2147483647>> : (FALSE \/ TRUE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08563 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 94 to line 14, col 133 of module random_08563
---*)
