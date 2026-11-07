(*---
description: Evaluates a random int expression, seed 262, number 5383.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05383 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SubSeq(<<1>>, 7, 7)) .. [a |-> (1 - 2147483647), b |-> (1 = -1)]) \cup ({(-7) : b8320 \in (FALSE \ 2..1)} \cap UNION {[[x \in 1..2 |-> x] EXCEPT ![1] = 0], UNION {{1, 2}, {x \in 1..3 : x > 1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    7
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    7
---*)
