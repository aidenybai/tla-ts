(*---
description: Evaluates a random bool expression, seed 262, number 9305.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09305 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({} \subseteq Nat) \/ (<<3, 1, 2>> = (1 :> 2))) <=> (CHOOSE f \in [{} -> {}] : TRUE)) => (~([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] < LET b14441 == 2147483647 IN -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09305 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 18 to line 14, col 102 of module random_09305
---*)
