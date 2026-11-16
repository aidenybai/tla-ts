(*---
description: Evaluates a random set expression, seed 262, number 922.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00922 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (\A b1483 \in {} : <<1>>) -> (-7) [] OTHER -> (1 % 1) \div (CHOOSE b1484 \in {b1485 \in Nat : TRUE} : (7 = 1))) .. LET b1486 == ((-7) \div (3 % 2147483647)) IN ((CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE))[(b1486 + b1486)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00922 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 185 to line 14, col 226 of module random_00922
---*)
