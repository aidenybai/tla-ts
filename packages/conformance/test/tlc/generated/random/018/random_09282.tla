(*---
description: Evaluates a random bool expression, seed 262, number 9282.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09282 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SubSeq(Tail(<<1, 2>>), CASE FALSE -> 3 [] OTHER -> 2, Head(<<3, 1, 2>>))) \in [[[[a |-> 1] EXCEPT !.a = 1] EXCEPT !.a = (-0)] EXCEPT !.a = @ + (CHOOSE b14407 \in (\A b14408 \in SUBSET {1} : FALSE) : (FALSE => FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<2>>
    , but instead it is
    2
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<2>>
    , but instead it is
    2
---*)
