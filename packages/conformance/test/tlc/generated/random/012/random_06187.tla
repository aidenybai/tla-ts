(*---
description: Evaluates a random function expression, seed 262, number 6187.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06187 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[((1 :> 2) @@ <<5, 6>>) EXCEPT ![IF FALSE THEN 1 ELSE 2147483647] = IF FALSE THEN 7 ELSE 3] EXCEPT ![CASE (TRUE \/ TRUE) -> IF TRUE THEN 1 ELSE 1 [] OTHER -> (2147483647 \div 0)] = Cardinality(({1} \ SUBSET {1}))] @@ (CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 39 of module random_06187
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06187 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
