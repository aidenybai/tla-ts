(*---
description: Evaluates a random function expression, seed 262, number 5055.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05055 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 + 7) :> CASE TRUE -> 1 [] OTHER -> 2))[(DOMAIN 7)[(CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE)]] :> LET b7868 == Cardinality({2147483647, -1}) IN (LET b7869 == TRUE IN b7868 * IF TRUE THEN b7868 ELSE 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05055 failed.
    2178:0 Overflow when computing 2147483647+7
---*)
