(*---
description: Evaluates a random set expression, seed 262, number 1452.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01452 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({2147483647, 1} \cup (1..3 \cup {2, 1, 3})) \cup UNION {(2 .. 2), ({x \in 1..3 : x > 1} \cap {x \in 1..3 : x > 1})}) \cap ({b2320 \in ({1, 2} \ {2, 1, 3}) : (\E b2321 \in 1..3 : FALSE)} \ {Cardinality({1, 2}) : b2322 \in ({1} \ SUBSET {1})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01452 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
