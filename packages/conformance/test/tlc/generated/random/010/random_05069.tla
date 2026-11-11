(*---
description: Evaluates a random int expression, seed 262, number 5069.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05069 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([(([a |-> 1] = [a |-> 1]) <=> (3 \in SUBSET {1})) EXCEPT ![1] = {(<<1, 2>> + 1), IF FALSE THEN 1 ELSE 2147483647}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05069 failed.
    Attempted to check if the non-enumerable value
    3
    is element of
    {{}, {1}}
---*)
