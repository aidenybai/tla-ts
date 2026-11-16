(*---
description: Evaluates a random bool expression, seed 262, number 5277.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05277 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Append(<<1>>, 2147483647) = [[x \in 1..2 |-> x] EXCEPT ![{1}] = 3]) \/ (\E b8166 \in {b8167 : b8167 \in 2..1} : (\A b8168 \in 1..3 : FALSE))) \/ (CASE (2147483647 \in {x \in 1..3 : x > 1}) -> (7 % 2) [] OTHER -> (3 :> 1) = CASE (\A b8169 \in SUBSET {1} : TRUE) -> (CHOOSE b8170 \in 2..1 : FALSE) [] OTHER -> IF FALSE THEN [x \in Nat |-> x + 1] ELSE 2147483647)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05277 failed.
    Attempted to apply function with integer domain to the non-integer argument {1}
---*)
