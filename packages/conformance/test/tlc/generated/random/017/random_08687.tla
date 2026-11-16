(*---
description: Evaluates a random set expression, seed 262, number 8687.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08687 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b13453 \in ({b13454 \in 1..3 : TRUE} \cap {1, 2147483647}) : (~(TRUE <=> (1 :> 2)))} \ DOMAIN [(2147483647 :> 7) EXCEPT ![([a |-> 1]).a] = LET b13455 == 2 IN b13455]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08687 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 82 to line 14, col 98 of module random_08687
---*)
