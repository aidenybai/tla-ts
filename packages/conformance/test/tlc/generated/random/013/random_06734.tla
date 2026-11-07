(*---
description: Evaluates a random record expression, seed 262, number 6734.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06734 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality(DOMAIN (<<5, 6>> @@ (1 :> 2))), b |-> ([[1 EXCEPT !.a = @ + 2] EXCEPT !.a = @ + (2147483647 - 2)] => ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06734 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
