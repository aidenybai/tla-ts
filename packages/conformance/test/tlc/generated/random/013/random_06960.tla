(*---
description: Evaluates a random bool expression, seed 262, number 6960.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06960 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(({} \cup {1, 2}) \subseteq [a |-> 1, b |-> FALSE])) \/ ((CHOOSE b10649 \in {b10650 \in {1, 2} : TRUE} : ([a |-> 1] = [a |-> 1])) < (-(1 % 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06960 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1, b |-> FALSE]
---*)
