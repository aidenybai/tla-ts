(*---
description: Evaluates a random seq expression, seed 262, number 9431.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09431 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[x \in 1..2 |-> x] EXCEPT ![3] = 2147483647] @@ [b14637 \in SUBSET {1} |-> 1]) @@ ([[x \in 1..2 |-> x] EXCEPT ![1] = 2..1] @@ (TRUE :> 0))) @@ [b14638 \in ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] = [[a |-> 1] EXCEPT !.a = 2]) |-> ((b14638 + TRUE) - (b14638 :> b14638))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 37 of module random_09431
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09431 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of the set {} with the value:
    1
---*)
