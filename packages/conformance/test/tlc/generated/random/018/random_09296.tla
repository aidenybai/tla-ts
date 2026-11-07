(*---
description: Evaluates a random record expression, seed 262, number 9296.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09296 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([SelectSeq(SubSeq(<<3, 1, 2>>, 7, 7), LAMBDA e : e > 0) EXCEPT ![1] = Head(Append(<<3, 1, 2>>, 1))], (([<<5, 6>> EXCEPT ![2147483647] = {}] @@ (CHOOSE f \in [2..1 -> 2..1] : TRUE)))[LET b14424 == Len([x \in Nat |-> x + 1]) IN LET b14425 == -1 IN 0]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
---*)
