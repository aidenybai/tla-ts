(*---
description: Evaluates a random set expression, seed 262, number 9461.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09461 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b14699 \in ((1..3 \cap SUBSET {1}) \cap (-1 .. -1)) : (\E b14700 \in {2147483647 : b14701 \in SUBSET {1}} : ({1} \cup 1..3))} \cup [b14702 \in UNION {(3 .. 2147483647), {7, 2147483647}} |-> Cardinality(({x \in 1..3 : x > 1} \cap Nat))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09461 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
