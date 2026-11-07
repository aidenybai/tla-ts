(*---
description: Evaluates a random int expression, seed 262, number 8294.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08294 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SubSeq(Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), (2 - 2147483647)), (Cardinality(SUBSET {1}) \div CASE FALSE -> 7 [] OTHER -> 3), Cardinality({1, 1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2, -2147483645>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2, -2147483645>>
    , but instead it is
    0
---*)
