(*---
description: Evaluates a random set expression, seed 262, number 1319.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01319 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len([SubSeq(<<1, 2>>, b2099, b2099) EXCEPT ![1] = (-b2099)]) : b2099 \in {b2100 \in (LET b2101 == -1 IN 2147483647 % (0 % 0)) : ((2 .. 0) \subseteq ({x \in 1..3 : x > 1} \cap Nat))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01319 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
