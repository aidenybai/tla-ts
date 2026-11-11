(*---
description: Evaluates a random record expression, seed 262, number 4092.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04092 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (CHOOSE b6434 \in {x \in 1..3 : x > 1} : TRUE), b |-> (1..3 = 2..1)] EXCEPT !.a = @ + ([b6435 \in {2, 1, 3} |-> 0])[(-3)]] EXCEPT !.a = @ + Cardinality(((2..1 \ 1..3) \cup DOMAIN [x \in 1..2 |-> x]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04092 failed.
    In applying the function
    <<0, 0, 0>>,
    the first argument is:
    -3
    which is not in its domain.
---*)
