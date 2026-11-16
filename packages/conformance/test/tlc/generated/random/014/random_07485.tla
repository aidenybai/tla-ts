(*---
description: Evaluates a random seq expression, seed 262, number 7485.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07485 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((Append(SubSeq(<<1>>, 0, 3), (-1 % 1)) \o Append(Tail(<<1>>), [[a |-> 1] EXCEPT !.a = 0])), (-((CHOOSE r \in [a : {}] : TRUE)).a), (IF (FALSE => FALSE) THEN Head(<<1>>) ELSE (2 * 3) + (Cardinality({1}) - Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07485 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
---*)
