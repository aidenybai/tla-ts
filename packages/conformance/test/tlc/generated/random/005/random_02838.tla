(*---
description: Evaluates a random bool expression, seed 262, number 2838.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02838 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SortSeq(Tail(<<3, 1, 2>>), LAMBDA p, q : p < q)) = ([b4504 \in ({x \in 1..3 : x > 1} \cap Nat) |-> [a |-> b4504, b |-> FALSE]])[((<<5, 6>>)[-1] % (0 - -1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02838 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
