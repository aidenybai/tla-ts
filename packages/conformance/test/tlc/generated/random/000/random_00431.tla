(*---
description: Evaluates a random set expression, seed 262, number 431.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00431 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE TRUE -> 2147483647 [] OTHER -> 2147483647 = (<<5, 6>>)[<<3, 1, 2>>]) <=> (Tail(<<3, 1, 2>>) = (CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE))) \cup UNION {[b704 \in {b705 : b705 \in Nat} |-> LET b706 == b704 IN 2147483647], (({x \in 1..3 : x > 1} \cap {2, 1, 3}) \cup ({2, 1, 3} \cap {2, 1, 3}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00431 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 18 to line 14, col 162 of module random_00431
---*)
