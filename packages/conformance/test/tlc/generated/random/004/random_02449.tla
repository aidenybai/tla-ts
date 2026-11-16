(*---
description: Evaluates a random set expression, seed 262, number 2449.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02449 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE))[Len(<<[a |-> 1, b |-> TRUE], -1>>)], Len(([<<>> EXCEPT ![1] = 7] @@ (CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02449 failed.
    Attempted to apply function:
    <<>>
    to argument 2, which is not in the domain of the function.
---*)
