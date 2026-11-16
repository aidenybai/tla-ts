(*---
description: Evaluates a random function expression, seed 262, number 8152.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08152 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({CASE (\E b12605 \in {1} : TRUE) -> ({} \cap 2..1) [] OTHER -> ([a |-> 1, b |-> TRUE]).a, (-LET b12606 == 1 IN b12606)} \cup UNION {DOMAIN [(1 :> 2) EXCEPT ![2] = [a |-> 1]], {b12607 \in UNION {{1, 2}, [x \in Nat |-> x + 1]} : (\A b12608 \in 2..1 : FALSE)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 158 to line 14, col 163 of module random_08152
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08152 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer -1 with non-integer:
    {}
---*)
