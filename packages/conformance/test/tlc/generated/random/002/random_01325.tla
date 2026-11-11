(*---
description: Evaluates a random function expression, seed 262, number 1325.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01325 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2113 \in ({(CHOOSE b2115 \in {x \in 1..3 : x > 1} : FALSE) : b2114 \in (7 \cup 2..1)} \cap (({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1}) \cup (\E b2116 \in Nat : b2116))) |-> IF ((\A b2117 \in 1..3 : FALSE) \/ (\A b2118 \in <<5, 6>> : (1 :> 2))) THEN ([b2119 \in SUBSET {1} |-> 2])[(-1 \div b2113)] ELSE ((CHOOSE b2120 \in 1..3 : FALSE) - (CHOOSE b2121 \in 1..3 : FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01325 failed.
    TLC encountered a non-enumerable quantifier bound
    7.
    line 14, col 90 to line 14, col 100 of module random_01325
---*)
