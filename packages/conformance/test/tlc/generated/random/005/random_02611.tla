(*---
description: Evaluates a random bool expression, seed 262, number 2611.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02611 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (7 < -1) THEN (CHOOSE b4112 \in <<3, 1, 2>> : TRUE) ELSE ((1 :> 2))[-1] = IF (FALSE \/ TRUE) THEN Head(<<1, 2>>) ELSE (2 \div 2)) <=> (~LET b4113 == (CHOOSE b4114 \in 2..1 : FALSE) IN (2 + b4113))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02611 failed.
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
