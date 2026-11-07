(*---
description: Evaluates a random set expression, seed 262, number 8065.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08065 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-Len(SubSeq(<<>>, 0, 2))), (LET b12464 == IF TRUE THEN -1 ELSE 3 IN (CHOOSE b12465 \in {1, 2} : TRUE) + LET b12466 == Cardinality(SUBSET {1}) IN (2147483647 - <<3, 1, 2>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
