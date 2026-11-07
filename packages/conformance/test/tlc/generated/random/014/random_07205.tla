(*---
description: Evaluates a random bool expression, seed 262, number 7205.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07205 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b11070 \in {Cardinality(({} \cap {1})), (CHOOSE b11071 \in {7, -1} : <<3, b11071>>)} : IF ((<<1>> \/ TRUE) \/ (\E b11072 \in {2, 1, 3} : TRUE)) THEN ([a |-> FALSE, b |-> TRUE]).a ELSE ((b11070 :> b11070))[(CHOOSE b11073 \in Nat : TRUE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 61 to line 14, col 101 of module random_07205
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 61 to line 14, col 101 of module random_07205
---*)
