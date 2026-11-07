(*---
description: Evaluates a random function expression, seed 262, number 4563.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04563 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((FALSE \/ [a |-> 1]) :> (CHOOSE r \in [a : {1, 2}] : TRUE)) EXCEPT ![(({2, 1, 3} \subseteq SUBSET {1}) = [b7158 \in 1..3 |-> 2])] = CASE (~FALSE) -> Head(<<1>>) [] OTHER -> Len(<<>>)] @@ (CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04563 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a record.
    line 14, col 20 to line 14, col 37 of module random_04563
---*)
