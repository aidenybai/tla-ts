(*---
description: Evaluates a random bool expression, seed 262, number 1901.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01901 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(Tail([<<1>> EXCEPT ![1] = 3]), ((-1 :> 3))[(7 + 7)]) = [[b2982 \in UNION {1..3, {1, 2}} |-> (b2982 % 2147483647)] EXCEPT ![Len(Tail(<<1, 2>>))] = Len((<<1>> \o <<1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01901 failed.
    Attempted to apply function:
    (-1 :> 3)
    to argument 14, which is not in the domain of the function.
---*)
