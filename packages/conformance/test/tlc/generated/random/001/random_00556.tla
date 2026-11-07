(*---
description: Evaluates a random set expression, seed 262, number 556.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00556 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{([a |-> 7, b |-> SUBSET {1}]).a, Len(SubSeq(<<3, 1, 2>>, 2147483647, 2147483647))}, UNION {{(-1 * 2) : b943 \in ({} \cup {x \in 1..3 : x > 1})}, {Len(<<1>>), (0 \div 1)}}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    2147483647
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    2147483647
---*)
