(*---
description: Evaluates a random record expression, seed 262, number 5176.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05176 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[Len(SubSeq(<<>>, 0, 0)) EXCEPT !.a = Len(SubSeq(<<1>>, 1, 7))] EXCEPT !.a = @ + {LET b8029 == IF TRUE THEN Nat ELSE 1 IN ([x \in 1..2 |-> x])[1], ((-1 % 2147483647) + Head(<<3, 1, 2>>))}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05176 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
