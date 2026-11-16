(*---
description: Evaluates a random seq expression, seed 262, number 8669.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08669 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(([a |-> 1]).a - Cardinality(2..1)), (LET b13413 == 0 IN b13413 \div (CHOOSE b13414 \in 2..1 : 2147483647))>> \o SubSeq(Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)), ([[x \in 1..2 |-> x] EXCEPT ![7] = 2] % Cardinality({1})), (CHOOSE b13415 \in (SUBSET {1} \ {1}) : (<<>> = [x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08669 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 89 to line 14, col 123 of module random_08669
---*)
