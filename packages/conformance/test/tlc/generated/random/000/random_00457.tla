(*---
description: Evaluates a random set expression, seed 262, number 457.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00457 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b756 \in ({b757 : b757 \in 2..1} \cup {-1 : b758 \in {x \in 1..3 : x > 1}}) : ((0 :> b756) @@ [[a |-> 1] EXCEPT !.a = @ + b756])} \ ((Cardinality(2..1) \div (0 - -1)) .. (IF FALSE THEN 0 ELSE 7 * (3 * 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00457 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    0
---*)
