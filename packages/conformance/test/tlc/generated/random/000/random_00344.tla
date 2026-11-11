(*---
description: Evaluates a random set expression, seed 262, number 344.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00344 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(CHOOSE f \in [{} -> 1..2] : TRUE), ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a} \cap (Cardinality(({x \in 1..3 : x > 1} \ SUBSET {1})) .. Head(Tail(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00344 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
