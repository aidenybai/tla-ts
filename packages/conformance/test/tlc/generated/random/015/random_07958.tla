(*---
description: Evaluates a random function expression, seed 262, number 7958.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07958 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 :> 0) @@ ((1 :> 2) @@ (1 :> 2))) @@ (SubSeq([a |-> 1], 2, 2) @@ (CHOOSE f \in [2..1 -> 2..1] : TRUE))) @@ ([b12284 \in (SUBSET {1} \cap {1}) |-> (-b12284)] @@ (([x \in Nat |-> x + 1] @@ (1 :> 2)) @@ [[x \in 1..2 |-> x] EXCEPT ![2] = 7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1]
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> 1]
---*)
