(*---
description: Evaluates a random int expression, seed 262, number 8349.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08349 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (SortSeq([<<3, 1, 2>> EXCEPT ![1] = 1], LAMBDA p, q : p < q) = ((0 - 0) :> (CHOOSE b12914 \in 2..1 : FALSE))) THEN CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] \in {0 : b12915 \in {x \in 1..3 : x > 1}}) -> CASE (SUBSET {1} \subseteq {1, 2}) -> Cardinality({1}) [] OTHER -> ((1 :> 2))[1] [] OTHER -> [b12916 \in (2..1 \ {1}) |-> (b12916 \in {1})] ELSE (-LET b12917 == (3 \div 7) IN (b12917 - b12917)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08349 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 95 to line 14, col 124 of module random_08349
---*)
