(*---
description: Evaluates a random function expression, seed 262, number 2639.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02639 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(<<Head(<<1, 2>>), (-1 \div 2147483647)>>, Cardinality((2..1 \cap {1}))) EXCEPT ![1] = CASE (IF FALSE THEN 0 ELSE 2 < IF FALSE THEN 3 ELSE 7) -> LET b4167 == (CHOOSE b4168 \in 2..1 : 1..3) IN IF TRUE THEN b4167 ELSE <<3, 1, 2>> [] OTHER -> ((-1 % 3) + ([x \in Nat |-> x + 1]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02639 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 182 to line 14, col 209 of module random_02639
---*)
