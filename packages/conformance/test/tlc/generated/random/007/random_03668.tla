(*---
description: Evaluates a random set expression, seed 262, number 3668.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03668 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b5795 \in {b5796 \in ([<<3, 1, 2>> EXCEPT ![1] = 3] \o SelectSeq(<<1>>, LAMBDA e : e > 0)) : ({b5796, 3} \subseteq {b5797 \in SUBSET {1} : TRUE})} : (((b5795 .. b5795) = [[a |-> 1] EXCEPT !.a = 3]) <=> ((~FALSE) \/ ([a |-> 1] = [a |-> 1])))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03668 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    <<3, 1, 2, 1>>
    is not enumerable
---*)
