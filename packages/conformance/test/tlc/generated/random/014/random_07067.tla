(*---
description: Evaluates a random seq expression, seed 262, number 7067.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07067 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SubSeq(Append(<<>>, 7), (1 \div 3), IF FALSE THEN 1 ELSE 2147483647) \o Tail(<<0, 0>>)) EXCEPT ![1] = (((0 + 3) \div (1 - 7)) * (CASE FALSE -> 2 [] OTHER -> -1 \div CASE FALSE -> 0 [] OTHER -> 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07067 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<7>>
    , but instead it is
    0
---*)
