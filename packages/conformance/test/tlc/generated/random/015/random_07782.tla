(*---
description: Evaluates a random function expression, seed 262, number 7782.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07782 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b12003 \in [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = @ + ([x \in Nat |-> x + 1])[1]] |-> (CHOOSE b12004 \in (2..1 \cup SUBSET {1}) : (\A b12005 \in SUBSET {1} : TRUE))] @@ [b12006 \in UNION {{b12007 \in Nat : FALSE}, {-1, -1}} |-> (CHOOSE b12008 \in {7 : b12009 \in 1..3} : [<<5, 6>> EXCEPT ![b12006] = 2])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    The domains of formal parameters must be enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    The domains of formal parameters must be enumerable.
---*)
