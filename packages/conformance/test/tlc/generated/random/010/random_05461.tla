(*---
description: Evaluates a random record expression, seed 262, number 5461.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05461 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE TRUE -> 0 [] OTHER -> 3 :> IF TRUE THEN [x \in Nat |-> x + 1] ELSE <<5, 6>>) @@ (({1} \ {}) \subseteq (2..1 \cup SUBSET {1}))))[((IF FALSE THEN 0 ELSE 0 + CASE FALSE -> -1 [] OTHER -> 1) \div (([a |-> 1, b |-> TRUE]).a * (CHOOSE b8452 \in {} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05461 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
