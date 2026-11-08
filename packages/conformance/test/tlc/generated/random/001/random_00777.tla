(*---
description: Evaluates a random seq expression, seed 262, number 777.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00777 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(SelectSeq((<<3, 1, 2>> \o [x \in 1..2 |-> x]), LAMBDA e : e > 0), Len(SelectSeq(<<>>, LAMBDA e : e > 0)), ((CHOOSE r \in [a : 1..2] : TRUE)).a), (-(CHOOSE b1277 \in ({1, 2} \ 1..3) : ({x \in 1..3 : x > 1} \subseteq {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00777 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2, 1, 2>>
    , but instead it is
    0
---*)
