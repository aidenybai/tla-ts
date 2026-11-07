(*---
description: Evaluates a random function expression, seed 262, number 2277.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02277 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([b3593 \in ({x \in 1..3 : x > 1} \ Nat) |-> (CHOOSE b3594 \in Nat : FALSE)] @@ (CHOOSE f \in [1..2 -> 1..2] : TRUE)) EXCEPT ![IF (SubSeq(<<3, 1, 2>>, 2, 7) = ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x])) THEN Cardinality(DOMAIN [x \in Nat |-> x + 1]) ELSE Len(Append(<<3, 1, 2>>, 7))] = ([a |-> (1 + 1), b |-> (TRUE => FALSE)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
---*)
