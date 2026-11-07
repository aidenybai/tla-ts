(*---
description: Evaluates a random int expression, seed 262, number 6322.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06322 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE {0, -1} -> Cardinality({x \in 1..3 : x > 1}) [] OTHER -> LET b9717 == 0 IN 1 % (IF TRUE THEN 7 ELSE 0 + LET b9718 == 7 IN b9718)) % (-(Head(<<3, 1, 2>>) % CASE TRUE -> 7 [] OTHER -> 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06322 failed.
    A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a condition of a CASE. line 14, col 23 to line 14, col 29 of module random_06322
---*)
