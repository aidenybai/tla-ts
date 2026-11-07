(*---
description: Evaluates a random function expression, seed 262, number 6784.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06784 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\E b10406 \in {7, -1} : ({2, 1, 3} = {1, 2})) \/ ((2147483647 .. -1) = UNION {{2, 1, 3}, SUBSET {1}})) @@ (CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06784 failed.
    Attempted to compare integer 1 with non-integer:
    {1}
---*)
