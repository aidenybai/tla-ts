(*---
description: Evaluates a random function expression, seed 262, number 2688.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02688 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\A b4253 \in (SUBSET {1} \ {x \in 1..3 : x > 1}) : ({1, 2} = {2, 1, 3})) -> LET b4254 == Len(<<1, 2>>) IN ([a |-> 1]).a [] OTHER -> ([[x \in 1..2 |-> x] EXCEPT ![3] = 0])[Len(<<>>)] :> (((0 % 1) :> (CHOOSE b4255 \in {1} : TRUE)))[(([a |-> 1]).a * (0 + 7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02688 failed.
    Attempted to compare the set {} with the value:
    3
---*)
