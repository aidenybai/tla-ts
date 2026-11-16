(*---
description: Evaluates a random seq expression, seed 262, number 6116.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06116 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((CHOOSE f \in [{1, 2} -> {1, 2} \cap {2}] : TRUE))[LET b9412 == 3 IN b9412], Len(<<-1, 2147483647>>)} \cup {(Cardinality({}) + (0 % -1)), Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06116 failed.
    Attempted to apply function:
    <<2, 2>>
    to argument 3, which is not in the domain of the function.
---*)
