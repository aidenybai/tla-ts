(*---
description: Evaluates a random set expression, seed 262, number 4390.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04390 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b6907 \in {Len(<<3, 1, 2>>) : b6908 \in (2..1 \cap SUBSET {1})} : (((1 :> 2))[[a |-> 1]] \in DOMAIN <<5, 6>>)} \ {b6909 \in (Head(<<1, 2>>) .. (2147483647 % -1)) : ((3 \in {1}) <=> (b6909 < 2))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04390 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
