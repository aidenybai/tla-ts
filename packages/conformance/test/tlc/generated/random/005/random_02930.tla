(*---
description: Evaluates a random bool expression, seed 262, number 2930.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02930 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b4635 \in (Cardinality((2..1 \cap {2, 1, 3})) .. Cardinality((1 .. 0))) : ((({1, 2} \cup Nat) = ({1, 2} \cap SUBSET {1})) /\ (\E b4636 \in {b4637 \in 2..1 : FALSE} : (<<3, 1, 2>> = (1 :> 2))))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02930 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
