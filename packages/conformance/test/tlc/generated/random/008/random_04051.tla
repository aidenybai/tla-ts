(*---
description: Evaluates a random seq expression, seed 262, number 4051.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04051 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((CHOOSE r \in [a : {1, 2}] : TRUE)).a, IF [a |-> (3 \div 2), b |-> (<<3, 1, 2>> = [x \in Nat |-> x + 1])] THEN {(CHOOSE b6379 \in 2..1 : FALSE), Len(<<>>)} ELSE ((2 * 0) + IF FALSE THEN 0 ELSE 7)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04051 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
