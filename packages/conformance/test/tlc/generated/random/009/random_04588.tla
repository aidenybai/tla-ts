(*---
description: Evaluates a random seq expression, seed 262, number 4588.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04588 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE)), ((([a |-> 1])[1] - Len(<<>>)) * (Len(<<3, 1, 2>>) % LET b7190 == [x \in Nat |-> x + 1] IN 1)), (((3 % 1) % Head(TRUE)) * (CHOOSE b7191 \in UNION {2..1, {2, 1, 3}} : ({} \subseteq 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    (0 :> 2 @@ 1 :> 2)
    2283:0 The argument of Tail should be a sequence, but instead it is:
    (0 :> 2 @@ 1 :> 2)
---*)
