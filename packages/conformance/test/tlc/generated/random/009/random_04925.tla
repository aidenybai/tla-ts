(*---
description: Evaluates a random int expression, seed 262, number 4925.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04925 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-([b7661 \in {b7662 : b7662 \in 2..1} |-> ([a |-> 1]).a])[((CHOOSE b7663 \in 1..3 : TRUE) + (3 - 3))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04925 failed.
    In applying the function
    <<>>,
    the first argument is:
    1
    which is not in its domain.
---*)
