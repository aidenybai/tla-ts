(*---
description: Evaluates a random seq expression, seed 262, number 5718.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05718 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Append([SubSeq(<<3, 1, 2>>, -1, 2147483647) EXCEPT ![1] = (0 * 7)], (([a |-> 1]).a * (7 \div 2))) EXCEPT ![1] = Len(SubSeq((CHOOSE f \in [{2, 1, 3} -> {1}] : TRUE), ([a |-> 1, b |-> TRUE]).a, (-1 % -1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
