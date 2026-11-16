(*---
description: Evaluates a random function expression, seed 262, number 7519.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07519 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b11586 \in (((1 :> 2) \/ TRUE) .. ([a |-> 1]).a) |-> (CHOOSE b11587 \in UNION {SUBSET {1}, {1, 2}} : (<<>> = <<5, 6>>))] EXCEPT ![((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a] = ((Cardinality(FALSE) * Cardinality(1..3)) - (Cardinality([x \in 1..2 |-> x]) % Len(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07519 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 31 to line 14, col 46 of module random_07519
---*)
