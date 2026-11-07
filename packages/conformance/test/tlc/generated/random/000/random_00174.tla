(*---
description: Evaluates a random bool expression, seed 262, number 174.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00174 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SubSeq(<<>>, 1, 3)) % ({-1, -1} + Cardinality(SUBSET {1}))) \in ({([x \in Nat |-> x + 1])[b280] : b280 \in UNION {{1, 2}, {1}}} \ (DOMAIN [x \in Nat |-> x + 1] \ {b281 \in Nat : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    1
---*)
