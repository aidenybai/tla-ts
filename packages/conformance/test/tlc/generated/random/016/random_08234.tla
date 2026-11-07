(*---
description: Evaluates a random int expression, seed 262, number 8234.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08234 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (Append(SubSeq(<<3, 1, 2>>, -1, -1), Cardinality(1..3)) = (CHOOSE f \in [2..1 -> {1, 2}] : TRUE)) -> (DOMAIN (0 :> 7) \ (DOMAIN (1 :> 2) \cap {b12745 \in {1} : FALSE})) [] OTHER -> Cardinality(UNION {{b12746 \in 2147483647 : FALSE}, ({1} \cup 1..3)}))
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
