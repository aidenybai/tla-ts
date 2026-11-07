(*---
description: Evaluates a random function expression, seed 262, number 819.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00819 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1342 \in {b1343 \in UNION {(Nat \ {}), DOMAIN <<5, 6>>} : ((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = [[a |-> 1] EXCEPT !.a = b1343])} |-> (-CASE (-1 < b1342) -> (-b1342) [] OTHER -> (CHOOSE b1344 \in SUBSET {1} : FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
