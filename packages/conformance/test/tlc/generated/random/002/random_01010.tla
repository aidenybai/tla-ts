(*---
description: Evaluates a random seq expression, seed 262, number 1010.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01010 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(SubSeq(Tail(<<1>>), Len(<<>>), LET b1623 == -1 IN 1)), Cardinality({Cardinality(Nat) : b1624 \in (CHOOSE b1625 \in {1} : TRUE)})>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
