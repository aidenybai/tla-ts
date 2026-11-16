(*---
description: Evaluates a random set expression, seed 262, number 4372.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04372 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b6890 \in (Len(SubSeq(<<1, 2>>, 2, 1)) \ (({1} \cap {}) \cup ({x \in 1..3 : x > 1} \ {x \in 1..3 : x > 1}))) : (~(~(7 < b6890)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04372 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    0
    is not enumerable.
---*)
