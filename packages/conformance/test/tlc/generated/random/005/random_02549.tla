(*---
description: Evaluates a random bool expression, seed 262, number 2549.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02549 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {1}] : TRUE)).a .. Len(SubSeq(<<1>>, -1, 0))) \subseteq (DOMAIN [b4022 \in {2, 1, 3} |-> b4022] \cap {b4023 \in DOMAIN [x \in Nat |-> x + 1] : (TRUE /\ TRUE)})))
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
