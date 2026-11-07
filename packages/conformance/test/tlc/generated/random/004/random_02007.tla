(*---
description: Evaluates a random function expression, seed 262, number 2007.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02007 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{} -> {1, 2}] : TRUE) EXCEPT ![(([[a |-> 1] EXCEPT !.a = @ + 3]).a \div Len(SubSeq(<<1, 2>>, 0, 2147483647)))] = Cardinality({IF FALSE THEN -1 ELSE -1, (2147483647 * 1)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    0
---*)
