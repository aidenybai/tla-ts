(*---
description: Evaluates a random int expression, seed 262, number 7691.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07691 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b11845 \in (DOMAIN (CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE) \cup UNION {([a |-> 1, b |-> TRUE]).a, (1..3 \cup {1, 2})}) : ([a |-> (b11845 % b11845), b |-> (\A b11846 \in {2, 1, 3} : FALSE)] = [[a |-> 0, b |-> FALSE] EXCEPT !.a = IF FALSE THEN -1 ELSE b11845])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07691 failed.
    Attempted to compare the set {1, 2, 3} with the value:
    1
---*)
