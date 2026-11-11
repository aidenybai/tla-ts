(*---
description: Evaluates a random bool expression, seed 262, number 4518.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04518 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (~(<<>> = [x \in 1..2 |-> x])) -> ([b7101 \in {1} |-> 3])[CASE TRUE -> 3 [] OTHER -> 1] [] OTHER -> (CHOOSE b7102 \in ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) : (TRUE => FALSE)) < Cardinality({(7 - b7103) : b7103 \in ({2, 1, 3} \ 1..3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04518 failed.
    In applying the function
    <<3>>,
    the first argument is:
    3
    which is not in its domain.
---*)
