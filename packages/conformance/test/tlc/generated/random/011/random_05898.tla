(*---
description: Evaluates a random set expression, seed 262, number 5898.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05898 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9096 \in (((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a .. (((1 :> 2))[[x \in 1..2 |-> x]] % Cardinality(SUBSET {1}))) : (Len((b9096 = b9096)) .. CASE (-1 = 7) -> (1 \div b9096) [] OTHER -> LET b9097 == b9096 IN 0)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05898 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<1, 2>>
---*)
