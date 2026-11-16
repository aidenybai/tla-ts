(*---
description: Evaluates a random int expression, seed 262, number 1738.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01738 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((UNION {({1, 2} \cap [a |-> 1]), UNION {{1, 2}, {2, 1, 3}}} \ [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + Head(<<3, 1, 2>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01738 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1]
---*)
