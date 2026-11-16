(*---
description: Evaluates a random function expression, seed 262, number 783.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00783 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b1289 \in ({-1 : b1290 \in <<1>>} \cup (Nat \cap {1, 2})) |-> Head(Append(<<3, 1, 2>>, 3))] @@ [((CHOOSE f \in [{} -> {1, 2}] : TRUE) @@ [[x \in 1..2 |-> x] EXCEPT ![2] = 2147483647]) EXCEPT ![(IF TRUE THEN 2 ELSE <<1, 2>> - LET b1291 == 1 IN [x \in Nat |-> x + 1])] = ([a |-> 2, b |-> [a |-> 1]] \div (7 * 1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00783 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1>>.
    line 14, col 45 to line 14, col 49 of module random_00783
---*)
