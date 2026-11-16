(*---
description: Evaluates a random int expression, seed 262, number 3676.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03676 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b5809 == LET b5810 == (CHOOSE b5811 \in {2, 0} : (TRUE <=> TRUE)) IN ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a IN IF (Append(<<1, 2>>, b5809) = [b5812 \in SUBSET {1} |-> -1]) THEN Head([<<>> EXCEPT ![1] = b5809]) ELSE (-(b5809 * 2)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -4"
---*)
