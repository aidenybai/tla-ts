(*---
description: Evaluates a random bool expression, seed 262, number 5679.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05679 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 .. 1) \cap Len(<<>>)) \cup (DOMAIN <<5, 6>> \ ({} \ 1..3))) = ((({x \in 1..3 : x > 1} \cup {2, 1, 3}) \ {-1, 1}) \cap ((0 .. 7) \ (1 .. 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05679 failed.
    Attempted to check if the value:
    0
    is an element of the integer 0
---*)
