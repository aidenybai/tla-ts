(*---
description: Evaluates a random set expression, seed 262, number 2591.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02591 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b4085 == ([b4086 \in {2, 1, 3} |-> b4086])[(7 % 0)] IN (IF FALSE THEN 2 ELSE 0 - IF FALSE THEN -1 ELSE b4085) : b4084 \in DOMAIN ((0 :> 7) @@ [[x \in Nat |-> x + 1] EXCEPT ![{2, 1, 3}] = 7])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02591 failed.
    2158:0 Attempted to check if the value:
    {1, 2, 3}
    is an element of Nat.
---*)
