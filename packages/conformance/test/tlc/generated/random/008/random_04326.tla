(*---
description: Evaluates a random bool expression, seed 262, number 4326.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04326 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<IF (7 \in SUBSET {1}) THEN Head(<<>>) ELSE ((1 :> 2))[1], (([a |-> 1]).a - IF 3 THEN 7 ELSE 0)>> = ((<<-1, 0>> = [b6818 \in Nat |-> b6818]))[IF ({1} \subseteq 1..3) THEN CASE FALSE -> 0 [] OTHER -> 2147483647 ELSE ([a |-> 1, b |-> TRUE] \div 2)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04326 failed.
    Attempted to check if the non-enumerable value
    7
    is element of
    {{}, {1}}
---*)
