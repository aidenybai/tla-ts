(*---
description: Evaluates a random set expression, seed 262, number 3704.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03704 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({Len(Tail(<<1>>)) : b5854 \in UNION {({x \in 1..3 : x > 1} \ TRUE), (0 .. 2147483647)}} \cap (([a |-> 2147483647, b |-> FALSE]).a \cup ({2, 7} \cup ({x \in 1..3 : x > 1} \cup Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03704 failed.
    Attempted to check if the value:
    2
    is an element of the boolean TRUE
---*)
