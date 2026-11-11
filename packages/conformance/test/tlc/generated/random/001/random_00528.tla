(*---
description: Evaluates a random int expression, seed 262, number 528.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00528 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({((b891 % 0) % ([x \in Nat |-> x + 1])[b891]) : b891 \in (Cardinality({x \in 1..3 : x > 1}) \div [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00528 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
