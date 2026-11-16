(*---
description: Evaluates a random set expression, seed 262, number 1385.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01385 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(-2147483647), (2147483647 % 2147483647)} \cup (DOMAIN <<5, 6>> \ UNION {{x \in 1..3 : x > 1}, (1 :> 2)})) \ (CASE ([x \in Nat |-> x + 1] /\ FALSE) -> (7 \div 0) [] OTHER -> IF FALSE THEN 1 ELSE 3 + ((7 - 2147483647) % LET b2211 == 2 IN b2211))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01385 failed.
    Attempted to compare the function <<2>> with the value:
    {2, 3}
---*)
