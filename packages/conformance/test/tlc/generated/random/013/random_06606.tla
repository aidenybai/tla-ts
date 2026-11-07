(*---
description: Evaluates a random int expression, seed 262, number 6606.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06606 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((SubSeq(<<1>>, -1, 7) \o (<<1>> \o TRUE)) \o Tail(Append(<<1, 2>>, -1))) \o (Append([<<1>> EXCEPT ![1] = 7], Head(<<>>)) \o SubSeq(SubSeq(<<1>>, 7, (1 :> 2)), ([x \in 1..2 |-> x])[7], (-2)))))
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
