(*---
description: Evaluates a random int expression, seed 262, number 9674.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09674 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 * 2147483647) - (CHOOSE b15016 \in {x \in 1..3 : x > 1} : TRUE)) :> (SubSeq(<<3, 1, 2>>, 3, 7) + (<<5, 6>>)[7])))[CASE [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] EXCEPT !.a = (2 + 2)] -> (Head(<<3, 1, 2>>) * Head(<<>>)) [] OTHER -> Head((Nat \subseteq 1..3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09674 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
---*)
