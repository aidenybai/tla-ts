(*---
description: Evaluates a random seq expression, seed 262, number 2424.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02424 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA e : e > 0) \o SubSeq([<<1>> EXCEPT ![1] = 0], Len(<<1, 2>>), CASE TRUE -> 3 [] OTHER -> 0)) \o SortSeq(Append(Append(<<1, 2>>, 0), (1 - 1)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<0>>
    , but instead it is
    2
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<0>>
    , but instead it is
    2
---*)
