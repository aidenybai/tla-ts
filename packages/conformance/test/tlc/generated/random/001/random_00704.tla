(*---
description: Evaluates a random set expression, seed 262, number 704.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00704 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE))[(-b1171)] : b1171 \in (CASE FALSE -> 7 [] OTHER -> 2147483647 .. (7 % 2))} \cup {b1172 \in (\E b1173 \in ({1, 2} \cap {}) : (b1173 = 0)) : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] = [a |-> b1172, b |-> FALSE])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00704 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    FALSE
    is not enumerable
---*)
