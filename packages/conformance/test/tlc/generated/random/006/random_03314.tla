(*---
description: Evaluates a random seq expression, seed 262, number 3314.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03314 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LET b5265 == 2147483647 IN -1, Len(<<1, 2>>)) \o SubSeq(<<1, 2>>, ({x \in 1..3 : x > 1} \cup 1..3), (0 \div 0))), ((Len(0) :> (0)[-1]))[LET b5266 == Cardinality(SUBSET {1}) IN Cardinality(1..3)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03314 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
---*)
