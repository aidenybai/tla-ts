(*---
description: Evaluates a random bool expression, seed 262, number 4020.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04020 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6317 \in {Head(SubSeq(<<1, 2>>, 2, 3)), Cardinality((0 .. 2))} : [(SubSeq(<<1>>, 0, 2) \o SubSeq(<<>>, b6317, b6317)) EXCEPT ![(CHOOSE b6318 \in {b6319 \in 1..3 : TRUE} : ({x \in 1..3 : x > 1} = 2..1))] = Head(Append(<<3, 1, 2>>, 3))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04020 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    3
---*)
