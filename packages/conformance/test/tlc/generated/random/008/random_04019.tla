(*---
description: Evaluates a random record expression, seed 262, number 4019.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04019 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[SortSeq(SubSeq(<<1, 2>>, 0, 2), LAMBDA p, q : p < q) EXCEPT !.a = Tail(Tail(FALSE))] EXCEPT !.a = ([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + Head(<<3, 1, 2>>)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
---*)
