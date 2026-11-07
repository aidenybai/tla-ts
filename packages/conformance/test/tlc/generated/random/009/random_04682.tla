(*---
description: Evaluates a random set expression, seed 262, number 4682.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04682 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE) \cup ((DOMAIN (1 :> 2) \cap {7, 3}) \ (DOMAIN [a |-> 1] \ UNION {<<5, 6>>, {x \in 1..3 : x > 1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04682 failed.
    Attempted to compare the set {2, 3} with the value:
    <<5, 6>>
---*)
