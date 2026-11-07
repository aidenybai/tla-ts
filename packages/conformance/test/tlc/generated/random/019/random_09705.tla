(*---
description: Evaluates a random set expression, seed 262, number 9705.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09705 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail(Tail(<<>>))) .. ((LET b15062 == 0 IN 0 :> ([x \in 1..2 |-> x])[2]))[CASE ([a |-> 1] = [a |-> 1]) -> (CHOOSE b15063 \in {1, 2} : FALSE) [] OTHER -> (1 - 1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
