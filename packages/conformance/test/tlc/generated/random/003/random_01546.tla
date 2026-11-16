(*---
description: Evaluates a random set expression, seed 262, number 1546.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01546 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b2460 \in (((TRUE <=> FALSE) \cap {b2461 \in {1} : TRUE}) \cap ((FALSE <=> FALSE) <=> (~FALSE))) : Len(SubSeq(Append(<<3, 1, 2>>, 2147483647), Len(<<>>), (<<5, 6>>)[b2460]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01546 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
