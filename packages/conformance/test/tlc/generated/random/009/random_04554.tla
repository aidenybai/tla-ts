(*---
description: Evaluates a random function expression, seed 262, number 4554.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04554 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7138 \in DOMAIN [x \in 1..2 |-> x] : (b7138 \in Nat)) * Len(SubSeq(<<1>>, 3, 7))) :> Head(SelectSeq(SubSeq(<<3, 1, 2>>, 7, 3), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    3
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    3
---*)
