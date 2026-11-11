(*---
description: Evaluates a random bool expression, seed 262, number 5946.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05946 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({CASE FALSE -> 2 [] OTHER -> 0, (-1 - -1)} \cup DOMAIN [b9163 \in 1..3 |-> 2147483647]) = {((CHOOSE f \in [{1} -> {1, 2}] : TRUE))[IF TRUE THEN 0 ELSE 0], CASE (\E b9164 \in Nat : b9164) -> CASE TRUE -> 7 [] OTHER -> 7 [] OTHER -> Cardinality(Nat)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05946 failed.
    Attempted to apply function:
    <<1>>
    to argument 0, which is not in the domain of the function.
---*)
