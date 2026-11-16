(*---
description: Evaluates a random function expression, seed 262, number 7028.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07028 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE) @@ [[b10782 \in UNION {{}, 1..3} |-> ([a |-> 1] \div b10782)] EXCEPT ![Cardinality({b10783 : b10783 \in {1, 2}})] = <<(1 + 2147483647), CASE FALSE -> 0 [] OTHER -> 2147483647>>]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07028 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 59 of module random_07028
---*)
