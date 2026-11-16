(*---
description: Evaluates a random set expression, seed 262, number 6234.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06234 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(({2, 1, 3} \ {2, 1, 3}) :> (3 * 1)) EXCEPT ![CASE (2147483647 = 0) -> ([x \in Nat |-> x + 1])[1] [] OTHER -> (7 \div 7)] = IF (FALSE /\ TRUE) THEN CASE FALSE -> 7 [] OTHER -> 3 ELSE IF FALSE THEN -1 ELSE -1] .. ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06234 failed.
    Attempted to check equality of the set {} with the value:
    1
---*)
