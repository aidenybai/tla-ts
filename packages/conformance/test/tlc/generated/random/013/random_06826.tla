(*---
description: Evaluates a random bool expression, seed 262, number 6826.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06826 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b10458 \in ((({} \cup {1}) \cup {2147483647, 2147483647}) \cap UNION {({} \cap 1..3), {b10459 \in {1} : TRUE}}) : ([SubSeq(<<1>>, 0, b10458) EXCEPT ![1] = (7 - b10458)] => (\A b10460 \in (2..1 \cup 2..1) : (-1 = 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
---*)
