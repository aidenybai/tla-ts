(*---
description: Evaluates a random seq expression, seed 262, number 6579.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06579 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((SubSeq(Append(<<1, 2>>, 2), CASE FALSE -> 3 [] OTHER -> -1, (-1)) \o SubSeq(SubSeq(<<>>, 7, <<1, 2>>), (3 * 2), Head(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06579 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2, 2>>
    , but instead it is
    -1
---*)
