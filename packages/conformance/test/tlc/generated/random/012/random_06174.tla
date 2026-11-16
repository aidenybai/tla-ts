(*---
description: Evaluates a random seq expression, seed 262, number 6174.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06174 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(SubSeq(Append(<<>>, -1), (0 * 2147483647), (0 \div 2))) EXCEPT ![1] = ((CHOOSE b9497 \in DOMAIN <<5, 6>> : ({x \in 1..3 : x > 1} = {x \in 1..3 : x > 1})) + (LET b9498 == 1 IN -1 * Cardinality({1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06174 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<-1>>
    , but instead it is
    0
---*)
