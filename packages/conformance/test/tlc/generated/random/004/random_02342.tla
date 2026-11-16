(*---
description: Evaluates a random bool expression, seed 262, number 2342.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02342 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({LET b3714 == IF FALSE THEN 1 ELSE 1 IN Head(<<1>>), Head((1 \div 2147483647))} = DOMAIN (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02342 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    0
---*)
