(*---
description: Evaluates a random record expression, seed 262, number 5400.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05400 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(\A b8359 \in (IF TRUE THEN 1 ELSE 2 .. IF FALSE THEN 0 ELSE [a |-> 1]) : ((1 * 2) = CASE TRUE -> b8359 [] OTHER -> 1)) EXCEPT !.a = ((CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE) @@ [b8360 \in {<<1, 2>>, 2147483647} |-> (3 - 0)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05400 failed.
    TLC encountered a non-enumerable quantifier bound
    1.
    line 14, col 32 to line 14, col 86 of module random_05400
---*)
