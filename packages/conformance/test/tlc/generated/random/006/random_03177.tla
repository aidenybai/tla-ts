(*---
description: Evaluates a random bool expression, seed 262, number 3177.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03177 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((CASE TRUE -> 2147483647 [] OTHER -> <<5, 6>> - Head(<<>>)) \in (UNION {(1 :> 2), {1}} \cup (3 % 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03177 failed.
    Attempted to compare the set {1} with the value:
    <<2>>
---*)
