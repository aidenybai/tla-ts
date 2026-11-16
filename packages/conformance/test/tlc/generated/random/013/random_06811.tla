(*---
description: Evaluates a random set expression, seed 262, number 6811.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06811 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((CHOOSE f \in [2..1 -> {}] : TRUE))[LET b10441 == 0 IN b10441]) .. (((CHOOSE b10442 \in {} : TRUE) - (-1 \div 1)) * (({x \in 1..3 : x > 1} \cup Nat) \subseteq {b10443 : b10443 \in SUBSET {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06811 failed.
    Attempted to apply function:
    <<>>
    to argument 0, which is not in the domain of the function.
---*)
