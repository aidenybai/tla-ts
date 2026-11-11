(*---
description: Evaluates a random function expression, seed 262, number 2119.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02119 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3364 \in DOMAIN ((CHOOSE f \in [{1, 2} -> 1..2] : TRUE) @@ (CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE)) |-> (((-1 + b3364) * (b3364 * b3364)) + ((-1 :> b3364))[Head(<<1>>)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02119 failed.
    Attempted to apply function:
    (-1 :> 1)
    to argument 1, which is not in the domain of the function.
---*)
