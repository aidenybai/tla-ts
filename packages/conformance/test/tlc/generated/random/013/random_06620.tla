(*---
description: Evaluates a random set expression, seed 262, number 6620.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06620 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10160 \in (Len(SubSeq(<<1, 2>>, SUBSET {1}, 7)) .. {Head(<<>>) : b10161 \in (-1 .. 7)}) : ({(b10162 - b10162) : b10162 \in {b10160 : b10163 \in 2..1}} \subseteq {(CHOOSE b10165 \in 1..3 : TRUE) : b10164 \in {0, 2147483647}})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    {{}, {1}}
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    {{}, {1}}
---*)
