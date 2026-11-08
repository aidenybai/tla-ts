(*---
description: Evaluates a random int expression, seed 262, number 2020.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02020 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (\E b3203 \in DOMAIN ((1 :> 2) @@ [x \in Nat |-> x + 1]) : ((CHOOSE r \in [a : 1..2] : TRUE) = [[a |-> 1] EXCEPT !.a = 2])) -> (CHOOSE b3204 \in ({b3205 \in 2..1 : FALSE} \cup (2..1 \cap {1, 2})) : ((FALSE => FALSE) \/ (TRUE /\ TRUE))) [] OTHER -> (CHOOSE b3206 \in ((CHOOSE f \in [{2, 1, 3} -> {}] : TRUE) \cup {7, 3}) : (~(\E b3207 \in 1..3 : -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02020 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
