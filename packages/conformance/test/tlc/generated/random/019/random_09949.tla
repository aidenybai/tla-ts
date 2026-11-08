(*---
description: Evaluates a random record expression, seed 262, number 9949.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09949 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((0 % 0) :> ([a |-> 1, b |-> TRUE]).a))[([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a], b |-> ((DOMAIN (1 :> 2) \cup (Nat \cup {x \in 1..3 : x > 1})) = [a |-> Head(<<1>>), b |-> (<<>> = (1 :> 2))])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09949 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
