(*---
description: Evaluates a random record expression, seed 262, number 724.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00724 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SubSeq(Tail(<<1>>), CASE TRUE -> 7 [] OTHER -> 2, ([x \in Nat |-> x + 1])[7])), b |-> ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) /\ (Len(<<>>) = (-3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    7
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    7
---*)
