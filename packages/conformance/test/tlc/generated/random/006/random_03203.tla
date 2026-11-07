(*---
description: Evaluates a random function expression, seed 262, number 3203.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03203 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE) @@ ((CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE) @@ [(2147483647 :> 2) EXCEPT ![(-0)] = IF FALSE THEN 2147483647 ELSE 0])))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 138 to line 14, col 152 of module random_03203
    | (2 :> 2 @@ 2147483647 :> 2)
---*)
