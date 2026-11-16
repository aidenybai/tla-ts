(*---
description: Evaluates a random record expression, seed 262, number 2772.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02772 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] EXCEPT !.a = ([x \in 1..2 |-> x])[3]] EXCEPT !.a = (([a |-> 1]).a % (7 + 3))] EXCEPT !.a = @ + ((CHOOSE b4378 \in (-1 - 1) : (TRUE => FALSE)) - Cardinality(SelectSeq(<<1>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02772 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
