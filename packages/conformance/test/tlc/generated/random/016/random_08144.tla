(*---
description: Evaluates a random function expression, seed 262, number 8144.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08144 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Tail(<<1>>)) :> Len(Tail(<<>>))) @@ [[([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) EXCEPT ![(-1 \div 3)] = ([a |-> 1, b |-> TRUE] + 2)] EXCEPT ![Head((<<>> \o <<1, 2>>))] = ((1 \div 3) + (0 % 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
