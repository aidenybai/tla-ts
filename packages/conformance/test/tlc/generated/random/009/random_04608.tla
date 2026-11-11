(*---
description: Evaluates a random set expression, seed 262, number 4608.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04608 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([b7215 \in DOMAIN (1 :> 2) |-> (b7215 + 2147483647)])[([b7216 \in {2, 1, 3} |-> b7216])[Head(<<>>)]], ([a |-> (2147483647 - 1), b |-> (<<3, 1, 2>> = [x \in 1..2 |-> x])]).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04608 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
