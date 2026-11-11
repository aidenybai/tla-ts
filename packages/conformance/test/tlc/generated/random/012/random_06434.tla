(*---
description: Evaluates a random set expression, seed 262, number 6434.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06434 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-Head(<<1, 2>>)) : b9901 \in ((1 \cup {x \in 1..3 : x > 1}) \ {7, 0})} .. (Cardinality({2 : b9902 \in Nat}) - ([<<5, 6>> EXCEPT ![3] = 0])[Head(<<1, 2>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06434 failed.
    Attempted to enumerate S \cup T when S:
    {2, 3}
    and T:
    1
    are not both enumerable
---*)
