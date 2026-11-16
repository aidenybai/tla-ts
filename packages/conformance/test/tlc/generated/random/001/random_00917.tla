(*---
description: Evaluates a random int expression, seed 262, number 917.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00917 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b1479 \in DOMAIN <<5, 6>> |-> (b1479 * 0)] EXCEPT ![(CASE FALSE -> 0 [] OTHER -> 7 + ([x \in 1..2 |-> x])[2])] = CASE (FALSE \/ TRUE) -> Head(<<1>>) [] OTHER -> Len(<<>>)])[CASE ((7 \div 1) \in UNION {{}, {2, 1, 3}}) -> Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) [] OTHER -> ((2147483647 \div 1) \div (7 % 2147483647))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 60 of module random_00917
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00917 failed.
    In applying the function
    <<0, 0>>,
    the first argument is:
    306783378
    which is not in its domain.
---*)
