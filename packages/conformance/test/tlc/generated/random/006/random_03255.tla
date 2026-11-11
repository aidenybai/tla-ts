(*---
description: Evaluates a random set expression, seed 262, number 3255.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03255 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b5180 == Len(<<1, 2>>) IN ([a |-> 1]).a .. Len([<<3, 1, 2>> EXCEPT ![1] = 2147483647])) \ ({LET b5182 == b5181 IN 2147483647 : b5181 \in UNION {3, {x \in 1..3 : x > 1}}} \cup (CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03255 failed.
    Attempted to compare the set {2, 3} with the value:
    3
---*)
