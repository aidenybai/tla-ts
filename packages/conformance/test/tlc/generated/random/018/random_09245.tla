(*---
description: Evaluates a random bool expression, seed 262, number 9245.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09245 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (TRUE <=> FALSE) THEN CASE TRUE -> [a |-> 1] [] OTHER -> 0 ELSE Len(<<1, 2>>) < SortSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA p, q : p < q)) => (\A b14354 \in ((<<>> = <<5, 6>>) .. Head(<<>>)) : ((-1 .. 3) = (b14354 .. b14354)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    <<>>
    2266:0 The second argument of < should be an integer, but instead it is:
    <<>>
---*)
