(*---
description: Evaluates a random int expression, seed 262, number 1101.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01101 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE))[(-([a |-> 1, b |-> TRUE]).a)] + LET b1755 == Len(Tail(<<>>)) IN ((<<>> \o <<1, 2>>))[LET b1756 == b1755 IN 3]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01101 failed.
    Attempted to apply function:
    (2 :> 2)
    to argument -1, which is not in the domain of the function.
---*)
