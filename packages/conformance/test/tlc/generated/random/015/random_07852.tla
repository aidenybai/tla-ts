(*---
description: Evaluates a random bool expression, seed 262, number 7852.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07852 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b12133 \in ({FALSE, 1} \cap DOMAIN [x \in 1..2 |-> x]) : (Tail(<<1, 2>>) = [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = <<3, 1, 2>>])} = {([[x \in 1..2 |-> x] EXCEPT ![-1] = 3])[([a |-> 1, b |-> TRUE]).a], Len(Tail(<<>>))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07852 failed.
    Attempted to check if the value:
    FALSE
    is in the integer interval 1..2
---*)
