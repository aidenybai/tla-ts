(*---
description: Evaluates a random int expression, seed 262, number 4731.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04731 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 2 ELSE -1 - Head(<<1, 2>>)) + Len([<<>> EXCEPT ![1] = 2])) :> (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]).a * IF (\E b7396 \in {x \in 1..3 : x > 1} : FALSE) THEN ([a |-> 1]).a ELSE (<<5, 6>>)[3])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 68 to line 14, col 71 of module random_04731
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04731 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
