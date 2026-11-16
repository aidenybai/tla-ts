(*---
description: Evaluates a random seq expression, seed 262, number 1108.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01108 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<IF (Cardinality(1..3) = CASE FALSE -> 0 [] OTHER -> 2147483647) THEN (([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))[(CHOOSE b1772 \in {1} : FALSE)] ELSE Head(SortSeq([x \in 1..2 |-> x], LAMBDA p, q : p < q)), (CHOOSE b1773 \in {b1774 \in DOMAIN [x \in 1..2 |-> x] : (b1774 < b1774)} : ((<<1>> = [x \in 1..2 |-> x]) /\ ({1} = {})))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01108 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 229 to line 14, col 347 of module random_01108
---*)
