(*---
description: Evaluates a random function expression, seed 262, number 7179.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07179 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} -> 1..2] : TRUE) @@ [b11024 \in UNION {{b11025 \in 1..3 : TRUE}, (3 .. -1)} |-> (Len(<<1>>) \div ((1 :> 2))[-1])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07179 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
