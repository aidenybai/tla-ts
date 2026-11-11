(*---
description: Evaluates a random function expression, seed 262, number 6325.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06325 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9720 \in (UNION {(1 .. -1), UNION {SUBSET {1}, {1}}} \cap CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> Cardinality({x \in 1..3 : x > 1}) [] OTHER -> (CHOOSE b9721 \in {2, 1, 3} : FALSE)) : (((\E b9722 \in SUBSET {1} : FALSE) => ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) <=> ((7 \div 1) = [[a |-> 1] EXCEPT !.a = b9720]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06325 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 167 to line 14, col 200 of module random_06325
---*)
