(*---
description: Evaluates a random bool expression, seed 262, number 9864.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09864 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ((CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE))[([a |-> 1]).a], b |-> (CASE FALSE -> 0 [] OTHER -> 3 = (7 + 2))] => (((\E b15322 \in {2, 1, 3} : TRUE) = ({1, 2} \ [a |-> 1, b |-> TRUE])) => ((\E b15323 \in {x \in 1..3 : x > 1} : TRUE) /\ (\E b15324 \in {1, 2} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09864 failed.
    Attempted to apply function:
    (2 :> 1)
    to argument 1, which is not in the domain of the function.
---*)
