(*---
description: Evaluates a random int expression, seed 262, number 693.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00693 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b1158 == Head(Append((<<1>> \o <<>>), Head(<<3, 1, 2>>))) IN ((CHOOSE f \in [{2, 1, 3} -> 1..2] : TRUE))[(-(b1158 - b1158))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00693 failed.
    Attempted to apply function:
    <<1, 1, 1>>
    to argument 0, which is not in the domain of the function.
---*)
