(*---
description: Evaluates a random int expression, seed 262, number 9542.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09542 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head([Tail(SubSeq(<<1, 2>>, 0, 2)) EXCEPT ![1] = CASE (<<1>> = <<5, 6>>) -> [<<5, 6>> EXCEPT ![0] = -1] [] OTHER -> (CHOOSE b14828 \in {} : FALSE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
---*)
