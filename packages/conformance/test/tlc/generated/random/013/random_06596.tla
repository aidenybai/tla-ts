(*---
description: Evaluates a random function expression, seed 262, number 6596.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06596 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10120 \in ((LET b10121 == -1 IN 7 .. IF FALSE THEN -1 ELSE 2147483647) \ {(3 \div 1) : b10122 \in ({2, 1, 3} \ <<1, 2>>)}) |-> IF (~(\A b10123 \in Nat : [x \in 1..2 |-> x])) THEN (([a |-> 1, b |-> TRUE]).a * (b10120 - 2147483647)) ELSE (CHOOSE b10124 \in {b10125 \in {2, 1, 3} : FALSE} : (2147483647 \in 1..3))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06596 failed.
    Attempted to check set membership in a tuple value.
---*)
