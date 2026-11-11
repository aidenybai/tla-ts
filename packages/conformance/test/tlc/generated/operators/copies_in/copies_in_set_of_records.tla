(*---
description: copies_in applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Bags.java#CopiesIn
features:
  - value-matrix
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
      2105:1 Evaluating assumption line 23, col 8 to line 23, col 11 of module copies_in_set_of_records failed.
      2169:0 The second argument of CopiesIn should be a bag, but instead it is:
      {[a |-> 1], [a |-> 2]}
---*)
---- MODULE copies_in_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CopiesIn(1, [a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 23, col 8 to line 23, col 11 of module copies_in_set_of_records failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Bags.CopiesIn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Cannot read field "values" because "fcn" is null
---*)
