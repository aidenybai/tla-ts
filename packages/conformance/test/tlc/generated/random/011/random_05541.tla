(*---
description: Evaluates a random record expression, seed 262, number 5541.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05541 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((-7) + IF FALSE THEN 0 ELSE 1), b |-> (~[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3])] EXCEPT !.a = @ + ((Tail(<<>>) - (3 % -1)) % <<(CHOOSE b8571 \in {x \in 1..3 : x > 1} : Nat), Cardinality({1})>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05541 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a record)
    line 14, col 64 to line 14, col 106 of module random_05541
---*)
