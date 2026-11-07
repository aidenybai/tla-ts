(*---
description: Evaluates a random int expression, seed 262, number 3361.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03361 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SubSeq(<<CASE TRUE -> 2147483647 [] OTHER -> 2147483647, ([x \in 1..2 |-> x])[2]>>, ((-0) * CASE FALSE -> 7 [] OTHER -> 2147483647), CASE (<<>> = [x \in 1..2 |-> x]) -> (-1) [] OTHER -> (1 \div 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<2147483647, 2>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<2147483647, 2>>
    , but instead it is
    0
---*)
