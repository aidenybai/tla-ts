(*---
description: Evaluates a random seq expression, seed 262, number 5452.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05452 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(SortSeq(<<0, 7>>, LAMBDA p, q : p < q), [a |-> (1 + 0), b |-> (1 = <<5, 6>>)]), Head(Append(Append(<<3, 1, 2>>, 0), (2 - 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05452 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<5, 6>>
---*)
