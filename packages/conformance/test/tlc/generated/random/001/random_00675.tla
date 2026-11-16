(*---
description: Evaluates a random function expression, seed 262, number 675.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00675 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE) EXCEPT ![CASE (FALSE \/ TRUE) -> CASE TRUE -> 7 [] OTHER -> 2147483647 [] OTHER -> Head(<<1, 2>>)] = ([b1129 \in SUBSET {1} |-> b1129])[(CHOOSE b1130 \in {1, 2} : FALSE)]] @@ ([b1131 \in DOMAIN [x \in 1..2 |-> x] |-> Head(<<1, 2>>)] @@ (CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 68 of module random_00675
    | <<1, 0>>
---*)
