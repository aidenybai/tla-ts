(*---
description: Evaluates a random function expression, seed 262, number 9899.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09899 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b15392 \in UNION {{Len(<<3, 1, 2>>) : b15393 \in {7, 3}}, {Cardinality({1}), Cardinality(2..1)}} |-> Len((SubSeq(<<1>>, b15392, 3) \o (<<3, 1, 2>> \o <<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    0
---*)
