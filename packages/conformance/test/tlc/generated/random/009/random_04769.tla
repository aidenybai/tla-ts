(*---
description: Evaluates a random seq expression, seed 262, number 4769.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04769 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(CASE TRUE -> 0 [] OTHER -> 1 \div (1 % 0)), (-LET b7451 == 2 IN 0)>> \o SortSeq((SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o SubSeq(<<1, 2>>, 2147483647, 2147483647)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04769 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    2147483647
---*)
