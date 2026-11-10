(*---
description: Evaluates a random bool expression, seed 262, number 1811.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01811 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (<<7, 0>> = ((1 :> 2) @@ (1 :> 2))) -> (CASE <<3, 1, 2>> -> 2 [] OTHER -> 3 \div Tail(<<1, 2>>)) [] OTHER -> IF (FALSE \/ TRUE) THEN (<<5, 6>>)[0] ELSE ([a |-> 1]).a \in (DOMAIN [[x \in 1..2 |-> x] EXCEPT ![0] = 0] \ (([a |-> 1]).a .. Len(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01811 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
