(*---
description: Evaluates a random set expression, seed 262, number 7583.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07583 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(<<SubSeq(<<3, 1, 2>>, (1 :> 2), 7), (-1 \div 0)>>), (-CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) [] OTHER -> (CHOOSE b11670 \in {1, 2} : TRUE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<2>>
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<2>>
---*)
