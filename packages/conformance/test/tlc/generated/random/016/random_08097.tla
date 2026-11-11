(*---
description: Evaluates a random int expression, seed 262, number 8097.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08097 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b12504 \in {1, 2} |-> 7])[(<<5, 6>>)[7]] - Head([<<1, 2>> EXCEPT ![1] = TRUE])) \div Len(SelectSeq(Append(<<>>, 0), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08097 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
