(*---
description: Evaluates a random bool expression, seed 262, number 5973.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05973 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail((<<<<1>>, 3>> \o SubSeq(<<1>>, -1, 3))) = ((({} \cup <<5, 6>>) + Cardinality(Nat)) :> IF (2 = 2) THEN (1 - 7) ELSE Head(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -1
---*)
