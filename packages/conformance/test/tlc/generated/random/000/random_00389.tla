(*---
description: Evaluates a random record expression, seed 262, number 389.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00389 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b638 == {(-0), Head(<<>>)} IN ([b639 \in {x \in 1..3 : x > 1} |-> 3])[CASE TRUE -> 3 [] OTHER -> b638], b |-> (Head(<<0, 0>>) = [[[x \in 1..2 |-> x] EXCEPT ![-1] = 2] EXCEPT ![(CHOOSE b640 \in {} : FALSE)] = (0 - 7)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 157 to line 14, col 174 of module random_00389
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00389 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 204 to line 14, col 229 of module random_00389
---*)
