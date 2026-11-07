(*---
description: Evaluates a random function expression, seed 262, number 358.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00358 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CASE (\E b587 \in SUBSET {1} : [a |-> 1, b |-> TRUE]) -> (-7) [] OTHER -> (CHOOSE b588 \in 2..1 : TRUE) :> LET b589 == (2147483647 + <<3, 1, 2>>) IN (0 - 0)) EXCEPT ![(IF (TRUE => TRUE) THEN (1 - 2) ELSE (7 - 3) + ((3 = 2) * [<<1>> EXCEPT ![1] = <<>>]))] = CASE (\E b590 \in (0 \cap {1}) : (~[a |-> 1])) -> IF (7 < <<1>>) THEN <<7, 7>> ELSE (2 + TRUE) [] OTHER -> ((-1 - 1) % IF TRUE THEN 0 ELSE -1)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 24 to line 14, col 69 of module random_00358
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 24 to line 14, col 69 of module random_00358
---*)
