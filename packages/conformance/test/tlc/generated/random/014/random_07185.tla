(*---
description: Evaluates a random bool expression, seed 262, number 7185.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07185 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SubSeq(Append(<<1, 2>>, 2), CASE TRUE -> 2147483647 [] OTHER -> 3, (2147483647 \div 2147483647))) = (Head(SubSeq(<<5, 6>>, 0, 2147483647)) * (Len(<<1, 2>>) \div [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<5, 6>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<5, 6>>
    , but instead it is
    0
---*)
