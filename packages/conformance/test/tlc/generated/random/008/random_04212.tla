(*---
description: Evaluates a random seq expression, seed 262, number 4212.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04212 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<(<<5, 6>>)[1], LET b6622 == 0 IN 3>> \o <<(-7), Head(<<1, 2>>)>>) \o Append(SubSeq([<<1, 2>> EXCEPT ![1] = 0], Len(<<1>>), Cardinality({2, 1, 3})), ((2147483647 \div 7) \div (CHOOSE b6623 \in Nat : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04212 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<0, 2>>
    , but instead it is
    3
---*)
