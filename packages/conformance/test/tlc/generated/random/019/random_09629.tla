(*---
description: Evaluates a random seq expression, seed 262, number 9629.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09629 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append(SubSeq([<<3, 1, 2>> EXCEPT ![1] = TRUE], Len(<<1>>), (2147483647 % 2)), IF (~TRUE) THEN Head([a |-> 1, b |-> TRUE]) ELSE Cardinality(Nat)) EXCEPT ![1] = (-([a |-> 3, b |-> FALSE]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09629 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
