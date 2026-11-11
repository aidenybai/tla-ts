(*---
description: Evaluates a random function expression, seed 262, number 1300.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01300 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {}] : TRUE) EXCEPT ![(-IF TRUE THEN -1 ELSE [x \in 1..2 |-> x])] = (Cardinality({1}) * Head(<<3, 1, 2>>))] @@ ((IF FALSE THEN 2 ELSE [a |-> 1, b |-> TRUE] - (0 - [a |-> 1])) :> ((2 \div 2) + ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01300 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 46 of module random_01300
---*)
