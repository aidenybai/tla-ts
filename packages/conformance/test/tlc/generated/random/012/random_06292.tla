(*---
description: Evaluates a random bool expression, seed 262, number 6292.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06292 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<3, 1, 2>> \o <<1>>) \o SelectSeq(<<1>>, LAMBDA e : e > 0)) = SubSeq(SubSeq(<<1, 2>>, 7, 2147483647), ([a |-> 1, b |-> TRUE]).a, (0 + 3))) => (Cardinality((FALSE .. FALSE)) < ([[x \in Nat |-> x + 1] EXCEPT ![0] = 0]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06292 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    7
---*)
