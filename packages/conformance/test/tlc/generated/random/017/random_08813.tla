(*---
description: Evaluates a random function expression, seed 262, number 8813.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08813 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE) EXCEPT !.a = CASE ((CHOOSE b13649 \in <<1, 2>> : FALSE) \in ({} \cup {})) -> LET b13650 == (<<5, 6>> @@ (1 :> 2)) IN (TRUE \div b13650) [] OTHER -> IF ({x \in 1..3 : x > 1} = {x \in 1..3 : x > 1}) THEN (7 \div 2147483647) ELSE (3 * 7)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08813 failed.
    Attempted to check equality of integer 2 with non-integer:
    "a"
---*)
