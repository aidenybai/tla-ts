(*---
description: Evaluates a random set expression, seed 262, number 3755.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03755 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN <<5, 6>> \cup ({1} \ {1})) \cap {b5920 \in {b5921 \in {1} : FALSE} : ([a |-> 1] = [a |-> 1, b |-> TRUE])}) \cap (((SUBSET {1} \ {1}) \cup DOMAIN (1 :> 2)) \ ([b5922 \in SUBSET {1} |-> TRUE])[(2 + 7)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03755 failed.
    Attempted to check if the non-enumerable value
    9
    is element of
    {{}, {1}}
---*)
