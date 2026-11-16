(*---
description: Evaluates a random function expression, seed 262, number 5525.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05525 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(-1 :> 2147483647) EXCEPT ![LET b8544 == 0 IN b8544] = (3 % 1)] EXCEPT ![(Cardinality({2, 1, 3}) - LET b8545 == 1 IN b8545)] = (Head(<<1>>) - (2147483647 + 0))] EXCEPT ![(CASE ({1} = {1, 2}) -> (-1 % -1) [] OTHER -> IF TRUE THEN -1 ELSE [a |-> 1] - (Cardinality(2..1) + (2 = 0)))] = ((CASE FALSE -> 1 [] OTHER -> 2 % LET b8546 == 1 IN b8546) * (-(CHOOSE b8547 \in 2..1 : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 35 of module random_05525
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 81 of module random_05525
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05525 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 366 to line 14, col 393 of module random_05525
---*)
