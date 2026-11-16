(*---
description: Evaluates a random int expression, seed 262, number 7136.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07136 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SubSeq(SubSeq(Append(<<1, 2>>, 2147483647), Len(<<3, 1, 2>>), (2147483647 \div 1)), (IF TRUE THEN -1 ELSE 1 * (Nat - -1)), (IF FALSE THEN 1 ELSE 1 % LET b10961 == -1 IN b10961))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07136 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<1, 2, 2147483647>>
    , but instead it is
    2147483647
---*)
