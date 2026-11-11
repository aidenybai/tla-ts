(*---
description: Evaluates a random function expression, seed 262, number 2705.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02705 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [2..1 -> {1, 2}] : TRUE) @@ [(Head(<<3, 1, 2>>) :> (3 % 3)) EXCEPT ![(Head(<<>>) + Len(<<1>>))] = CASE (3 < 7) -> (1 - 7) [] OTHER -> (3 % 0)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02705 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
