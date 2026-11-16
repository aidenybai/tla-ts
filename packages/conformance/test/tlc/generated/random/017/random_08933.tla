(*---
description: Evaluates a random set expression, seed 262, number 8933.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08933 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{CASE (\E b13855 \in 1..3 : TRUE) -> LET b13856 == 3 IN b13856 [] OTHER -> Head(<<1, 2>>), CASE SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) -> ([a |-> 1]).a [] OTHER -> (-1 * 0)}, (((2 .. 2147483647) \ ({1} \cap {2, 1, 3})) \ ((2 :> 0))[(2147483647 + 7)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08933 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 119 to line 14, col 158 of module random_08933
---*)
