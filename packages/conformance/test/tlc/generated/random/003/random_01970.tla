(*---
description: Evaluates a random set expression, seed 262, number 1970.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01970 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b3122 \in DOMAIN (7 :> -1) : (SubSeq(<<>>, -1, 2) = (CHOOSE f \in [1..2 -> 2..1] : TRUE))) .. ((CHOOSE r \in [a : {1, 2}] : TRUE)).a))
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
