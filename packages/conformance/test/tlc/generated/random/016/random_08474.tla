(*---
description: Evaluates a random bool expression, seed 262, number 8474.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08474 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b13113 \in ((DOMAIN (1 :> 2) \cap (FALSE \cap SUBSET {1})) \cap DOMAIN ({} \cap 2..1)) : (\A b13114 \in DOMAIN ([x \in Nat |-> x + 1] @@ <<5, 6>>) : ((b13114 = 0) \/ (TRUE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08474 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
