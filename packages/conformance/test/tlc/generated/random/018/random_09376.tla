(*---
description: Evaluates a random function expression, seed 262, number 9376.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09376 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((0 * 0) \div IF FALSE THEN {1} ELSE 1)) :> (((SUBSET {1} \ SUBSET {1})).a % IF (TRUE <=> FALSE) THEN ([x \in Nat |-> x + 1])[-1] ELSE (3 \div 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09376 failed.
    Attempted to select field "a" from a non-record value {}
    line 14, col 64 to line 14, col 92 of module random_09376
---*)
