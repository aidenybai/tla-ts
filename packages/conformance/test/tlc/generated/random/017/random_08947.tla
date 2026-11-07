(*---
description: Evaluates a random int expression, seed 262, number 8947.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08947 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail(SubSeq(<<3, 1, 2>>, 1, 7))) - IF ({b13884 : b13884 \in Nat} = DOMAIN (1 :> 2)) THEN LET b13885 == (CHOOSE b13886 \in [a |-> 1, b |-> TRUE] : TRUE) IN (<<5, 6>>)[1] ELSE (IF TRUE THEN 1 ELSE 0 + ((1 :> 2))[3])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
---*)
