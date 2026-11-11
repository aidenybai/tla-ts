(*---
description: Evaluates a random record expression, seed 262, number 3783.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03783 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + ((CHOOSE b5972 \in {2, (1 :> 2)} : (<<3, 1, 2>> = [x \in 1..2 |-> x])) - IF (\A b5973 \in SUBSET {1} : FALSE) THEN Cardinality({1}) ELSE (2 - 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03783 failed.
    Attempted to compare the function <<2>> with the value:
    2
---*)
