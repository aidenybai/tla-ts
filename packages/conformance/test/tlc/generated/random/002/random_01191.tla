(*---
description: Evaluates a random int expression, seed 262, number 1191.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01191 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\E b1907 \in (({1} \ {x \in 1..3 : x > 1}) \cap {Nat : b1908 \in 3}) : (\A b1909 \in DOMAIN <<3, 1, 2>> : (<<3, 1, 2>> = <<5, 6>>))) THEN ((-Head(<<1, 2>>)) * (SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) % (1 * 3))) ELSE LET b1910 == Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) IN ((7 + 0) + IF FALSE THEN b1910 ELSE 2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01191 failed.
    TLC encountered a non-enumerable quantifier bound
    3.
    3
---*)
