(*---
description: Evaluates a random function expression, seed 262, number 6204.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06204 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b9554 \in (((2147483647 :> 2) \cap (Nat \cap {2, 1, 3})) \cup ((0 * 0) .. (<<>> \o <<3, 1, 2>>))) |-> Len((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o Append(<<>>, b9554)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06204 failed.
    Attempted to check if the value:
    2
    is an element of the function (2147483647 :> 2)
---*)
