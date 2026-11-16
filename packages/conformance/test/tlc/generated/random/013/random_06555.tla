(*---
description: Evaluates a random function expression, seed 262, number 6555.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06555 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(([x \in 1..2 |-> x] @@ <<5, 6>>) @@ [b10076 \in 1..3 |-> b10076]) EXCEPT ![((CHOOSE r \in [a : 2..1] : TRUE)).a] = Head(SortSeq(<<>>, LAMBDA p, q : p < q))] @@ (CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06555 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 96 to line 14, col 125 of module random_06555
---*)
