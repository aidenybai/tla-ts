(*---
description: Evaluates a random function expression, seed 262, number 1018.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01018 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{} -> {1}] : TRUE) EXCEPT ![((CHOOSE b1641 \in 1..3 : (1 :> 2)) \div (CHOOSE b1642 \in {} : FALSE))] = ([[a |-> 1] EXCEPT !.a = 2147483647]).a] @@ (CHOOSE f \in [{} -> {0} \cup {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01018 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 63 to line 14, col 94 of module random_01018
---*)
