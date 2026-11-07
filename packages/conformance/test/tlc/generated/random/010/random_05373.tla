(*---
description: Evaluates a random seq expression, seed 262, number 5373.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05373 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Append(SortSeq(<<>>, LAMBDA p, q : p < q), (7 - 0)), LAMBDA e : e > 0) EXCEPT ![1] = Cardinality(((CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE) @@ (<<5, 6>> @@ <<5, 6>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<1, 1>>
    2181:0 Attempted to compute cardinality of the value
    <<1, 1>>
---*)
