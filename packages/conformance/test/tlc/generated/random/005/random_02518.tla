(*---
description: Evaluates a random set expression, seed 262, number 2518.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02518 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE) @@ (<<5, 6>> :> 0)) \cap ({b3972 : b3972 \in {}} \cup (SUBSET {1} \ {x \in 1..3 : x > 1}))) \cap {(IF FALSE THEN -1 ELSE 7 + IF FALSE THEN 2147483647 ELSE -1), (LET b3973 == 0 IN 3 * (7 - 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02518 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of the function <<5, 6>> with the value:
    1
---*)
