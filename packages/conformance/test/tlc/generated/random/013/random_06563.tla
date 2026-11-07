(*---
description: Evaluates a random seq expression, seed 262, number 6563.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06563 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(SubSeq(SelectSeq(<<>>, LAMBDA e : e > 0), (<<5, 6>>)[2147483647], (-1 - -1)), LAMBDA e : e > 0), (-Cardinality(({1} \cap {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06563 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
