(*---
description: Evaluates a random record expression, seed 262, number 3090.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03090 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (\A b4921 \in FALSE : TRUE) THEN (2 - 7) ELSE (Nat \ {x \in 1..3 : x > 1}), b |-> (\A b4922 \in UNION {SUBSET {1}, {2, 1, 3}} : (TRUE => FALSE))] EXCEPT !.a = @ + IF ((<<1>> \o <<3, 1, 2>>) = [[x \in 1..2 |-> x] EXCEPT ![7] = 7]) THEN (CHOOSE b4923 \in {3, 2147483647} : (\E b4924 \in {} : FALSE)) ELSE (CHOOSE b4925 \in (SUBSET {1} \cup {}) : (~TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03090 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 41 to line 14, col 45 of module random_03090
---*)
