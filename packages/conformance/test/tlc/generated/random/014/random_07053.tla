(*---
description: Evaluates a random bool expression, seed 262, number 7053.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07053 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b10821 \in {(b10822 \div 0) : b10822 \in UNION {{}, {1, 2}}} : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = b10821] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + TRUE])) = (CHOOSE b10823 \in UNION {(2..1 \cap {1}), DOMAIN <<5, 6>>} : (\E b10824 \in (2..1 \cap {2, 1, 3}) : (\A b10825 \in Nat : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
