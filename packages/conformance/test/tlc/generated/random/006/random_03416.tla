(*---
description: Evaluates a random function expression, seed 262, number 3416.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03416 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b5422 \in ((UNION {1..3, 1..3} \cap (SUBSET {1} \ {2, 1, 3})) \cap {Len(<<1>>), IF TRUE THEN 0 ELSE 2}) |-> (([b5423 \in {1} |-> b5422] @@ [<<5, 6>> EXCEPT ![b5422] = b5422]))[Head(<<b5422, b5422>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03416 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
