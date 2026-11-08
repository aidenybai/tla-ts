(*---
description: Evaluates a random seq expression, seed 262, number 7721.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07721 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail((SubSeq(SubSeq(<<1, 2>>, 2, 3), IF TRUE THEN 7 ELSE 2, LET b11907 == -1 IN 7) \o SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07721 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    3
---*)
