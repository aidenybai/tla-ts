(*---
description: Evaluates a random set expression, seed 262, number 6149.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06149 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9458 \in Len([Append(<<>>, 2147483647) EXCEPT ![1] = (-2)]) : (Tail(Append(<<3, 1, 2>>, 7)) = ((CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE) @@ (CHOOSE f \in [{1, 2} -> 1..2] : TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06149 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    1
    is not enumerable
---*)
