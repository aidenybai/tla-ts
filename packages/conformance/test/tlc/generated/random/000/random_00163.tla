(*---
description: Evaluates a random record expression, seed 262, number 163.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00163 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (<<5, 6>>)[1], b |-> (2 < 1)] EXCEPT !.a = (([a |-> 1, b |-> TRUE]).a % (2 * 3))] EXCEPT !.a = @ + (([b255 \in SUBSET {1} |-> 0] @@ [<<5, 6>> EXCEPT ![1] = 7]))[IF (\A b256 \in {x \in 1..3 : x > 1} : TRUE) THEN LET b257 == -1 IN b257 ELSE (-3)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00163 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
