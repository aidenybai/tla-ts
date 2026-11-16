(*---
description: Evaluates a random seq expression, seed 262, number 9398.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09398 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SubSeq(Append(SortSeq(<<1>>, LAMBDA p, q : p < q), ([a |-> 1]).a), (([a |-> 1, b |-> TRUE]).a * (3 + 7)), ((0 :> 0))[(3 + 2147483647)]) EXCEPT ![1] = ((([a |-> 1]).a :> (<<5, 6>>)[1]) @@ ((CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE) @@ (2 :> 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09398 failed.
    2178:0 Overflow when computing 3+2147483647
---*)
