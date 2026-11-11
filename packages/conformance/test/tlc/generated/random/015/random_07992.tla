(*---
description: Evaluates a random set expression, seed 262, number 7992.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07992 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {Append(SortSeq(Append(<<1, 2>>, 7), LAMBDA p, q : p < q), Len(Append(<<1, 2>>, 2))), {(Len(<<3, 1, 2>>) * ([a |-> 1]).a), LET b12341 == ((1 :> 2))[3] IN IF TRUE THEN b12341 ELSE -1}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07992 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
