(*---
description: Evaluates a random set expression, seed 262, number 1413.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01413 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b2249 \in {((CHOOSE r \in [a : {1, 2}] : TRUE)).a, LET b2250 == Len(<<>>) IN (<<5, 6>>)[2147483647]} : (((b2249 + 2147483647) * (-b2249)) < (-(-2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01413 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
