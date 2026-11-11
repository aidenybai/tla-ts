(*---
description: Evaluates a random record expression, seed 262, number 6685.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06685 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 2, b |-> TRUE] EXCEPT !.a = @ + Head(<<1, 2>>)] EXCEPT !.a = @ + Cardinality({0, 0})] EXCEPT !.a = @ + (Head(SubSeq(<<1, 2>>, 0, 1)) - IF (2 < 2147483647) THEN (3 - 2147483647) ELSE (2..1 \subseteq {x \in 1..3 : x > 1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06685 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
---*)
