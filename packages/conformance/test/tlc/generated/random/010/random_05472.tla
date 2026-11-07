(*---
description: Evaluates a random bool expression, seed 262, number 5472.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05472 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b8468 \in {IF FALSE THEN <<5, 6>> ELSE 2, LET b8469 == 3 IN 2} |-> ([a |-> b8468, b |-> <<3, 1, 2>>]).a] = (Head(SubSeq(<<>>, -1, 2147483647)) \div ((CHOOSE b8470 \in {1, 2} : TRUE) - (<<1>> + 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    -1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    -1
---*)
