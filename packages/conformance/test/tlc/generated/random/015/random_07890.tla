(*---
description: Evaluates a random record expression, seed 262, number 7890.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07890 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (TRUE <=> FALSE) THEN CASE TRUE -> 0 [] OTHER -> 7 ELSE (2 % -1), b |-> (UNION {{1, 2}, SUBSET {1}} = (2..1 \ Nat))] EXCEPT !.a = @ + (((CHOOSE f \in [{1} -> {1, 2} \cap {2}] : TRUE) @@ ([x \in 1..2 |-> x] @@ <<5, 6>>)))[(CASE FALSE -> -1 [] OTHER -> 2 \div (SUBSET {1} \cup {x \in 1..3 : x > 1}))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07890 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
