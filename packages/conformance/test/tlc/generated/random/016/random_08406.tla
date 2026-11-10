(*---
description: Evaluates a random function expression, seed 262, number 8406.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08406 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13013 \in DOMAIN ([b13014 \in SUBSET {1} |-> 2] @@ (3 :> 2)) |-> Len(SortSeq(<<b13013, 2>>, LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08406 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 3 with non-integer:
    {}
---*)
