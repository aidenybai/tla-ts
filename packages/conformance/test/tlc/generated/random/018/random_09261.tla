(*---
description: Evaluates a random bool expression, seed 262, number 9261.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09261 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<(7 :> 7), (<<5, 6>>)[0]>>) < LET b14376 == Cardinality({1 : b14377 \in SUBSET {1}}) IN (-((1 :> 2))[0])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09261 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
