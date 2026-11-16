(*---
description: Evaluates a random set expression, seed 262, number 3035.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03035 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b4824 \in DOMAIN [b4825 \in (FALSE \cup {}) |-> LET b4826 == b4825 IN 2] : ([SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = (7 \div b4824)] = (CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03035 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    FALSE
    is not enumerable
---*)
