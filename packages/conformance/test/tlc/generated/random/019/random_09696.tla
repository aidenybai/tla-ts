(*---
description: Evaluates a random seq expression, seed 262, number 9696.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09696 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Append(Append(<<1, 2>>, 3), (-1 % 3)) \o [SubSeq(<<3, 1, 2>>, -1, 7) EXCEPT ![1] = (<<5, 6>>)[0]]) EXCEPT ![1] = Cardinality({LET b15043 == 2147483647 IN 3, ([a |-> 1]).a})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09696 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
