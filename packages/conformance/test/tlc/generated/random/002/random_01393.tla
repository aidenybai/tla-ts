(*---
description: Evaluates a random function expression, seed 262, number 1393.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01393 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b2224 \in {Len(<<1>>), (CHOOSE b2225 \in {2, 1, 3} : FALSE)} |-> ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a] @@ [b2226 \in (([x \in Nat |-> x + 1])[0] % CASE FALSE -> -1 [] OTHER -> 7) |-> Head(SortSeq(<<>>, LAMBDA p, q : p < q))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01393 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 42 to line 14, col 75 of module random_01393
---*)
