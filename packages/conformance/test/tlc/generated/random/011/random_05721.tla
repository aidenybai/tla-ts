(*---
description: Evaluates a random function expression, seed 262, number 5721.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05721 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE) @@ (Cardinality(({x \in 1..3 : x > 1} \cap SUBSET {1})) :> Len(SubSeq({x \in 1..3 : x > 1}, 2, -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05721 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
