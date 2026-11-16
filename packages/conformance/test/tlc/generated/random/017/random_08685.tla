(*---
description: Evaluates a random set expression, seed 262, number 8685.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08685 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b13447 \in {b13448 \in {IF FALSE THEN 2 ELSE 0, (CHOOSE b13449 \in 1..3 : TRUE)} : ({b13450 \in SUBSET {1} : FALSE} = (\E b13451 \in 2..1 : TRUE))} : ({b13452 \in DOMAIN <<5, 6>> : (<<>> = (1 :> 2))} \subseteq DOMAIN ([x \in Nat |-> x + 1] @@ <<5, 6>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08685 failed.
    Attempted to check equality of the set {} with the value:
    FALSE
---*)
