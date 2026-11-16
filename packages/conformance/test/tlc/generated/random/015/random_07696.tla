(*---
description: Evaluates a random record expression, seed 262, number 7696.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07696 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Cardinality(({b11854 : b11854 \in [a |-> 1, b |-> TRUE]} \cup UNION {2..1, {}})), b |-> (IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN (3 + -1) ELSE LET b11855 == 2147483647 IN [a |-> 1] \in {b11856 \in {<<>> : b11857 \in {2, 1, 3}} : [2147483647 EXCEPT ![{1, 2}] = b11856]})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07696 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1, b |-> TRUE].
    line 14, col 57 to line 14, col 77 of module random_07696
---*)
