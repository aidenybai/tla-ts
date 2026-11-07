(*---
description: Evaluates a random set expression, seed 262, number 1779.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01779 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{0, -1}, {0, 2147483647}} \cup {b2814 \in ({} \cup Nat) : (<<3, 1, 2>> = (1 :> 2))}) \cup (UNION {(Nat \cap {2, 1, 3}), (SUBSET {1} \cup [x \in Nat |-> x + 1])} \cup {b2815 \in ({1, 2} \cup Nat) : (<<1, 2>> = <<5, 6>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {{}, {1}}
    and T:
    [x \in Nat |-> <expression line 14, col 177 to line 14, col 181 of module random_01779>]
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {{}, {1}}
    and T:
    [x \in Nat |-> <expression line 14, col 177 to line 14, col 181 of module random_01779>]
    are not both enumerable
---*)
