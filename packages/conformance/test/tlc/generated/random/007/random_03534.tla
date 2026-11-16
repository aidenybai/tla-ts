(*---
description: Evaluates a random bool expression, seed 262, number 3534.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03534 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (TRUE <=> (1 :> 2)) -> Cardinality({}) [] OTHER -> (0 * 3) % ((CHOOSE f \in [{1, 2} \ {1} -> {1}] : TRUE))[LET b5587 == 0 IN b5587]) < ([a |-> Head(<<1>>), b |-> (<<1>> = (1 :> 2))]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03534 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 24 to line 14, col 40 of module random_03534
---*)
