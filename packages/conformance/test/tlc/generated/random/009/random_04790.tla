(*---
description: Evaluates a random set expression, seed 262, number 4790.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04790 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> (1 + 0), b |-> (\A b7479 \in {1} : FALSE)] EXCEPT !.a = @ + Len(Append(<<>>, 1))] \ (([b7480 \in {1} |-> b7480])[([a |-> 1, b |-> TRUE]).a] .. (-(-2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    [a |-> 2, b |-> FALSE]
    is not enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    [a |-> 2, b |-> FALSE]
    is not enumerable.
---*)
