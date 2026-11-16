(*---
description: Evaluates a random set expression, seed 262, number 1995.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01995 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 \div 2) + (-1 * 2147483647)) .. ([a |-> 1, b |-> TRUE]).a) \cup UNION {((2 + 7) :> (1 * 7)), {b3157 \in {b3158 : b3158 \in {1, 2}} : (<<1, 2>> = (1 :> 2))}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01995 failed.
    Size of interval value exceeds the maximum representable size (32bits): -2147483646..1.
---*)
