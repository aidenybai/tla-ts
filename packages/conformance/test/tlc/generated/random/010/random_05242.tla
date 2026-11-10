(*---
description: Evaluates a random set expression, seed 262, number 5242.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05242 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b8119 \in DOMAIN ((CHOOSE f \in [{1} -> 1..2] : TRUE) @@ (CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE)) : (([<<1>> EXCEPT ![1] = 0] = ({2, 1, 3} :> -1)) \/ ((<<1>> = [x \in 1..2 |-> x]) <=> (FALSE => TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05242 failed.
    Attempted to compare an integer with non-integer:
    {1, 2, 3}.
---*)
