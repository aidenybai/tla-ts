(*---
description: Evaluates a random seq expression, seed 262, number 4695.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04695 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(([b7339 \in ({1, 2} \cup <<3, 1, 2>>) |-> (CHOOSE b7340 \in {} : TRUE)] @@ [[b7341 \in 1..3 |-> [a |-> 1, b |-> TRUE]] EXCEPT ![(3 % -1)] = (CHOOSE b7342 \in {1} : FALSE)]), (((CHOOSE b7343 \in Nat : TRUE) + Cardinality({2, 1, 3})) + Cardinality({b7344 \in 2..1 : FALSE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04695 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
