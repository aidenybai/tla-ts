(*---
description: Evaluates a random int expression, seed 262, number 2638.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02638 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (Append(<<2, 1>>, IF FALSE THEN 2 ELSE 3) = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] @@ [b4165 \in SUBSET {1} |-> 1])) -> ((([x \in 1..2 |-> x])[2147483647] + Len(<<3, 1, 2>>)) - (-((1 :> 2))[3])) [] OTHER -> (Head(<<7, -1>>) + (CHOOSE b4166 \in ({2, 1, 3} \cup {}) : (FALSE <=> FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02638 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of the set {} with the value:
    "a"
---*)
