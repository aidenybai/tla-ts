(*---
description: Evaluates a random seq expression, seed 262, number 7717.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07717 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SubSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), (-2), LET b11904 == -1 IN b11904), ((2 + 7) \div Cardinality(2..1))) \o <<LET b11905 == ([a |-> 1, b |-> TRUE]).a IN Head(<<1>>), ((7 :> 3))[IF {x \in 1..3 : x > 1} THEN 1 ELSE 7]>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07717 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2, 3>>
    , but instead it is
    -2
---*)
