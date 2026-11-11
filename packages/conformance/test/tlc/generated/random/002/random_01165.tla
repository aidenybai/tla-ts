(*---
description: Evaluates a random record expression, seed 262, number 1165.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01165 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 2, b |-> TRUE] EXCEPT !.a = @ + (2147483647 % 2147483647)] EXCEPT !.a = @ + ([[a |-> 1] EXCEPT !.a = 0]).a] EXCEPT !.a = (CHOOSE b1864 \in ({2147483647, 2} \cup (1 \cup SUBSET {1})) : (\E b1865 \in (CHOOSE f \in [2..1 -> {1, 2} \ {1}] : TRUE) : ({1, 2} = 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01165 failed.
    Attempted to enumerate S \cup T when S:
    1
    and T:
    {{}, {1}}
    are not both enumerable
---*)
