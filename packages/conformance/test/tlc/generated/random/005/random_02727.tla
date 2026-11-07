(*---
description: Evaluates a random set expression, seed 262, number 2727.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02727 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN [b4303 \in (SUBSET {1} \cup SUBSET {1}) |-> Head(<<3, 1, 2>>)], [a |-> Head(Append(<<3, 1, 2>>, -1)), b |-> ((CHOOSE r \in [a : 1..2] : TRUE) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = -1])]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare record:
    [a |-> 3, b |-> FALSE]
    with non-record
    {{}, {1}}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare record:
    [a |-> 3, b |-> FALSE]
    with non-record
    {{}, {1}}
---*)
