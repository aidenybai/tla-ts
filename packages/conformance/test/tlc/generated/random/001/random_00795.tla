(*---
description: Evaluates a random seq expression, seed 262, number 795.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00795 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([SubSeq(SubSeq(<<3, 1, 2>>, 3, 0), (-2147483647), (2147483647 - 3)) EXCEPT ![1] = CASE (\A b1307 \in {2, 1, 3} : FALSE) -> ([a |-> 1]).a [] OTHER -> (-1 * 0)], Cardinality({(-b1308) : b1308 \in UNION {{x \in 1..3 : x > 1}, Nat}}), Head(SelectSeq([<<1, 2>> EXCEPT ![1] = -1], LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    -2147483647
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    -2147483647
---*)
