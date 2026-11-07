(*---
description: Evaluates a random bool expression, seed 262, number 3952.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03952 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6217 \in DOMAIN (([x \in Nat |-> x + 1])[0] @@ (-1 :> 1)) : (SubSeq(SubSeq(<<1, 2>>, b6217, 2), IF TRUE THEN b6217 ELSE 7, ([x \in Nat |-> x + 1])[-1]) = [b6218 \in {b6219 \in {1, 2} : FALSE} |-> (CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    1
    2169:0 The first argument of @@ should be a function, but instead it is:
    1
---*)
