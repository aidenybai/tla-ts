(*---
description: Evaluates a random function expression, seed 262, number 9111.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09111 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({b14158 : b14158 \in {x \in 1..3 : x > 1}} \cap {0, 2147483647})) :> (((CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE))[Cardinality({1})] + ((-7) % (2 + 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09111 failed.
    Attempted to apply function:
    (2 :> 0)
    to argument 1, which is not in the domain of the function.
---*)
