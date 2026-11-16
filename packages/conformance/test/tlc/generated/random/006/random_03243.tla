(*---
description: Evaluates a random set expression, seed 262, number 3243.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03243 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) : b5160 \in UNION {({x \in 1..3 : x > 1} \ SUBSET {1}), Len([a |-> 1])}} \ Tail(Tail([<<1>> EXCEPT ![1] = -1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03243 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
