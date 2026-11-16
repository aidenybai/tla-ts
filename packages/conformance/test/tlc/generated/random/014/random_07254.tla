(*---
description: Evaluates a random int expression, seed 262, number 7254.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07254 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [{1} -> {1, 2} \cap {2}] : TRUE))[(7 - 0)] - (-Len(<<>>))) - ([b11161 \in ({x \in 1..3 : x > 1} \ {1, 2}) |-> (b11161 % b11161)])[LET b11162 == (2 \div 7) IN CASE TRUE -> b11162 [] OTHER -> b11162]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07254 failed.
    Attempted to apply function:
    <<2>>
    to argument 7, which is not in the domain of the function.
---*)
