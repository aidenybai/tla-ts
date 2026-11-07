(*---
description: Evaluates a random int expression, seed 262, number 5929.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05929 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head([<<1, 2>> EXCEPT ![1] = 1]), b |-> ((~FALSE) <=> (2147483647 = 2))] EXCEPT !.a = ([b9141 \in ({2, 1, 3} \ {1, 2}) |-> (1 + b9141)])[Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05929 failed.
    In applying the function
    (3 :> 4),
    the first argument is:
    2
    which is not in its domain.
---*)
