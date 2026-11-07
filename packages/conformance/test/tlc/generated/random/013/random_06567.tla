(*---
description: Evaluates a random int expression, seed 262, number 6567.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06567 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(-(DOMAIN <<5, 6>> = (Nat \ [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06567 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
