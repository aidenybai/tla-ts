(*---
description: Evaluates a random function expression, seed 262, number 787.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00787 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b1293 \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE) : (LET b1294 == b1293 IN b1294 = (CHOOSE b1295 \in {} : <<1>>))) :> (LET b1296 == ([a |-> 1, b |-> TRUE]).a IN ([a |-> 1, b |-> TRUE]).a + LET b1297 == (CHOOSE b1298 \in {1} : FALSE) IN (7 \div b1297))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00787 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 43 to line 14, col 84 of module random_00787
---*)
