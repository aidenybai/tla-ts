(*---
description: Evaluates a random bool expression, seed 262, number 1432.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01432 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(LET b2289 == Len(<<1>>) IN (CHOOSE b2290 \in {2, 1, 3} : <<5, 6>>) :> [b2291 \in UNION {Nat, {2, 1, 3}} |-> LET b2292 == b2291 IN b2292]) EXCEPT ![Head(Append(SubSeq(<<1>>, {x \in 1..3 : x > 1}, 0), (2147483647 % 3)))] = (IF (Nat \cap 1..3) THEN (3 \div 7) ELSE SubSeq(<<>>, 2, 7) * (Head(<<1>>) \div (CHOOSE b2293 \in 1..3 : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01432 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 46 to line 14, col 82 of module random_01432
---*)
