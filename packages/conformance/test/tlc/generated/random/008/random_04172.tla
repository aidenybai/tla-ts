(*---
description: Evaluates a random int expression, seed 262, number 4172.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04172 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(SelectSeq(SubSeq(<<3, 1, 2>>, -1, 2147483647), LAMBDA e : e > 0)) \o SubSeq(((3 :> 7) \o SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)), (CASE [a |-> 1, b |-> TRUE] -> 3 [] OTHER -> 2 % (1)[TRUE]), Cardinality((0 .. 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
