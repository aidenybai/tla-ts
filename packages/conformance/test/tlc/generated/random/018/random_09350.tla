(*---
description: Evaluates a random seq expression, seed 262, number 9350.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09350 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(SubSeq(SubSeq(<<>>, 3, 2147483647), (-2147483647), (-7)), LAMBDA e : e > 0), ((CHOOSE b14510 \in (SUBSET {1} \cap {2, 1, 3}) : (1..3 \subseteq {1, 2})) - Cardinality(UNION {{1}, {2, 1, 3}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    3
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    3
---*)
