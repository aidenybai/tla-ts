(*---
description: Evaluates a random function expression, seed 262, number 1655.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01655 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} \ {1} -> {1}] : TRUE) EXCEPT ![Cardinality(Tail(SubSeq(<<>>, 0, 3)))] = ((LET b2640 == 2 IN <<3, 1, 2>> * CASE TRUE -> 1 [] OTHER -> 2) + (CHOOSE b2641 \in {0, 3} : Head(<<3, 1, 2>>)))])
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
