(*---
description: Evaluates a random record expression, seed 262, number 5615.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05615 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Append([<<1, 2>> EXCEPT ![1] = 1], Head(<<1, 2>>))) \o Tail(Append((<<1, 2>> \o <<1, 2>>), ((1 :> 2))[2]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05615 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
