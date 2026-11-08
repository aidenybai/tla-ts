(*---
description: Evaluates a random function expression, seed 262, number 634.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00634 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE) EXCEPT ![(CHOOSE b1056 \in {0 : b1057 \in {x \in 1..3 : x > 1}} : [a |-> -1, b |-> FALSE])] = Len((<<>> \o <<1>>))] EXCEPT ![IF ((\A b1058 \in {1, 2} : TRUE) /\ (\E b1059 \in {1, 2} : FALSE)) THEN ([a |-> 0, b |-> TRUE]).a ELSE (Head(<<3, 1, 2>>) * (2 \div 1))] = (Len((<<>> \o <<1, 2>>)) \div (Head(<<1, 2>>) .. Len(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00634 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 81 to line 14, col 159 of module random_00634
---*)
