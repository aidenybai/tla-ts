(*---
description: Evaluates a random function expression, seed 262, number 2669.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02669 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE) EXCEPT ![(CHOOSE b4215 \in ((SUBSET {1} \cup Nat) \cup {b4216 : b4216 \in 1..3}) : ([<<1, 2>> EXCEPT ![1] = b4215] = DOMAIN [x \in 1..2 |-> x]))] = (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a \in ((2147483647 + 0) .. ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02669 failed.
    Attempted to enumerate S \cup T when S:
    {{}, {1}}
    and T:
    Nat
    are not both enumerable
---*)
