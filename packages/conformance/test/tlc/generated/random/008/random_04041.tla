(*---
description: Evaluates a random seq expression, seed 262, number 4041.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
correct:
  all:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 25, col 8 to line 25, col 11 of module random_04041 failed.
      2183:0 The second argument of SubSeq must be in the domain of its first argument:
      <<3, 1, 2>>
      , but instead it is
      2147483647
---*)
---- MODULE random_04041 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> Cardinality(UNION {{x \in 1..3 : x > 1}, {x \in 1..3 : x > 1}}), b |-> (\A b6355 \in (7 .. 2147483647) : ({1} = {1, 2}))] \o SortSeq((SortSeq(<<>>, LAMBDA p, q : p < q) \o SubSeq(<<3, 1, 2>>, 2147483647, 2147483647)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1001:1 Java ran out of memory.  Running Java with a larger memory allocation
    pool (heap) may fix this.  But it won't help if some state has an enormous
    number of successor states, or if TLC must compute the value of a huge set.
---*)
