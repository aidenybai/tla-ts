(*---
description: Evaluates a random int expression, seed 262, number 582.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00582 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(([a |-> 2, b |-> TRUE]).a \div CASE (<<5, 6>> \in SUBSET {1}) -> (2 \div 3) [] OTHER -> (-0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00582 failed.
    Attempted to check if the non-enumerable value
    <<5, 6>>
    is element of
    {{}, {1}}
---*)
