(*---
description: Evaluates a random set expression, seed 262, number 6547.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06547 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(Tail((<<1>> \o <<1>>)), ((<<1, 2>> :> 2147483647))[(0 * 7)]), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06547 failed.
    Attempted to check equality of the function <<1, 2>> with the value:
    0
---*)
