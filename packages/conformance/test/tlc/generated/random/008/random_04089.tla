(*---
description: Evaluates a random int expression, seed 262, number 4089.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04089 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (Len(SubSeq(<<3, 1, 2>>, -1, 0)) < (LET b6429 == 3 IN b6429 + CASE FALSE -> 1 [] OTHER -> 0)) -> (CHOOSE b6430 \in {Head(<<1, 2>>), Append(<<1, 2>>, 0)} : ((1..3 \subseteq SUBSET {1}) => (<<3, 1, 2>> \o <<>>))) [] OTHER -> (-Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), Len(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04089 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
