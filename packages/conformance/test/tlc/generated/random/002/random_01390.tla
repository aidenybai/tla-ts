(*---
description: Evaluates a random set expression, seed 262, number 1390.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01390 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2218 \in {b2219 \in {(CHOOSE b2220 \in 2..1 : FALSE), Head(<<1>>)} : ([a |-> 1, b |-> TRUE] = [<<1, 2>> EXCEPT !.a = @ + 2147483647])} : ((-IF TRUE THEN 3 ELSE FALSE) \in {(2 - 7), Len(<<1, 2>>)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01390 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 40 to line 14, col 68 of module random_01390
---*)
