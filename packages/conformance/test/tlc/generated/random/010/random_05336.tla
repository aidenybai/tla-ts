(*---
description: Evaluates a random record expression, seed 262, number 5336.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05336 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [([b8251 \in 2 |-> b8251] @@ (CHOOSE f \in [2..1 -> {}] : TRUE)) EXCEPT ![(CHOOSE b8252 \in [[x \in 1..2 |-> x] EXCEPT ![-1] = 1] : ([a |-> 1] = [a |-> 1]))] = (CHOOSE b8253 \in {3, 2} : (<<1, 2>> = [x \in 1..2 |-> x]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05336 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the integer 2.
---*)
