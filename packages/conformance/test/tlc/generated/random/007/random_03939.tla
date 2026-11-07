(*---
description: Evaluates a random bool expression, seed 262, number 3939.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03939 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail((CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \cap {2}] : TRUE)) = [a |-> CASE FALSE -> 2 [] OTHER -> -1, b |-> (\E b6201 \in SUBSET {1} : 1..3)]) <=> ([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = (CHOOSE b6202 \in {1} : TRUE)] /\ ((0 < 1) <=> (FALSE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    (2 :> 2)
    2283:0 The argument of Tail should be a sequence, but instead it is:
    (2 :> 2)
---*)
