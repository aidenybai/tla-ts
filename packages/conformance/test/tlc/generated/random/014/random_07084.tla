(*---
description: Evaluates a random function expression, seed 262, number 7084.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07084 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((1 - -1) = (2147483647 * 3)) THEN Head(SelectSeq(<<>>, LAMBDA e : e > 0)) ELSE ((7 \div 7) * CASE TRUE -> 3 [] OTHER -> 7) :> (CHOOSE r \in [a : 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07084 failed.
    2178:0 Overflow when computing 2147483647*3
---*)
