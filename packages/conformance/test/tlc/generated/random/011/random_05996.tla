(*---
description: Evaluates a random bool expression, seed 262, number 5996.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05996 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), (7 - 2147483647), LET b9247 == 2 IN 2147483647) \o SortSeq((<<1>> \o <<1>>), LAMBDA p, q : p < q)) = (CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05996 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1>>
    , but instead it is
    -2147483640
---*)
