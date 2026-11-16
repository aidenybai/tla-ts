(*---
description: Evaluates a random bool expression, seed 262, number 2382.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02382 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = (CHOOSE b3777 \in DOMAIN <<5, 6>> : ({2, 1, 3} = b3777))] = [[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = (CHOOSE b3778 \in {} : FALSE)] EXCEPT !.a = LET b3779 == (CHOOSE b3780 \in {2, 1, 3} : TRUE) IN ((1 :> 2) + 7)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02382 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    1
---*)
