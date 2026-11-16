(*---
description: Evaluates a random bool expression, seed 262, number 6159.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06159 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([<<1>> EXCEPT ![1] = 2] \o (<<>> \o <<1, 2>>)) \o ([<<3, 1, 2>> EXCEPT ![1] = 1] \o Tail(<<>>))) = (((0 \div 3) :> Head(<<>>)) @@ [b9477 \in DOMAIN [x \in Nat |-> x + 1] |-> (TRUE * b9477)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06159 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
