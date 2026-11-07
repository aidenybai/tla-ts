(*---
description: Evaluates a random function expression, seed 262, number 5078.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05078 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7903 \in UNION {{(b7904 \div b7904) : b7904 \in DOMAIN <<5, 6>>}, ({1 : b7905 \in 2..1} \cup (Nat \cup 2..1))} |-> (((<<5, 6>> @@ [x \in 1..2 |-> x]) % (CHOOSE b7906 \in Nat : TRUE)) \div ((1 - 2147483647) - (b7903 \div [a |-> 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare overridden value Nat with non-overridden value:
    {1}
---*)
