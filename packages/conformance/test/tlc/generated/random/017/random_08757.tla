(*---
description: Evaluates a random set expression, seed 262, number 8757.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08757 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b13554 \in ([b13555 \in ({1, 2} \ {2, 1, 3}) |-> ([a |-> 1, b |-> TRUE]).a] \ SelectSeq(Append(<<>>, 3), LAMBDA e : e > 0)) : (Cardinality({2147483647, 1}) \in UNION {DOMAIN [x \in 1..2 |-> x], (1..3 \cap [a |-> 1])})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08757 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<>>
    is not enumerable.
---*)
