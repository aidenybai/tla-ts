(*---
description: Evaluates a random set expression, seed 262, number 8233.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08233 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b12742 \in [a |-> 1, b |-> TRUE] : TRUE} \ {b12743 \in {x \in 1..3 : x > 1} : TRUE}) \ (DOMAIN <<5, 6>> \ ({1, 2} \cup 2..1))) \ {b12744 \in DOMAIN ((1 :> 2) @@ [x \in 1..2 |-> x]) : (SelectSeq(<<5, 6>>, LAMBDA e : e > 0) = (b12744 :> b12744))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08233 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 1, b |-> TRUE]
    is not enumerable
---*)
