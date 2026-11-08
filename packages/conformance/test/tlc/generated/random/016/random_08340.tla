(*---
description: Evaluates a random function expression, seed 262, number 8340.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08340 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(2 :> 1) EXCEPT ![(-3)] = Len(<<>>)] EXCEPT ![(Head(<<3, 1, 2>>) + Head(<<1>>))] = (IF TRUE THEN 3 ELSE 0 - (2147483647 * 0))] EXCEPT ![(CHOOSE b12899 \in {b12900 \in {b12901 : b12901 \in SUBSET {1}} : (2 < 3)} : (SubSeq(<<1>>, b12899, -1) = (b12899 :> 2147483647)))] = ((Head(<<1, 2>>) - (2 - 1)) + LET b12902 == Head(<<1, 2>>) IN (2 \div b12902))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 25 of module random_08340
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 54 of module random_08340
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08340 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    {}
---*)
