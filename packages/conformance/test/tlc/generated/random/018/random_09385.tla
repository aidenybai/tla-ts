(*---
description: Evaluates a random set expression, seed 262, number 9385.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09385 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(([<<5, 6>> EXCEPT ![2] = 0])[(7 - 2)] * (([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]))[([a |-> 1, b |-> TRUE]).a]), (Head((<<1>> \o <<3, 1, 2>>)) - Len(Tail(<<>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09385 failed.
    Attempted to access index 5 of tuple
    <<5, 0>>
    which is out of bounds.
---*)
