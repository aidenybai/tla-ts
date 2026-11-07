(*---
description: Evaluates a random set expression, seed 262, number 8042.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08042 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(((1 :> 2) @@ [a |-> 1]))[CASE TRUE -> 2 [] OTHER -> 2147483647], ((3 - -1) \div (-1))} \ {((-b12413) - ([x \in Nat |-> x + 1])[b12413]) : b12413 \in UNION {{b12414 \in SUBSET {1} : FALSE}, ({2, 1, 3} \cup {x \in 1..3 : x > 1})}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of string "a" with non-string:
    1
---*)
