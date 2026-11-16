(*---
description: Evaluates a random function expression, seed 262, number 9813.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09813 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((\E b15233 \in {x \in 1..3 : x > 1} : FALSE) <=> (\A b15234 \in {1, 2} : TRUE)) -> LET b15235 == LET b15236 == Nat IN 1 IN Head(<<>>) [] OTHER -> (CHOOSE b15237 \in {b15238 \in {x \in 1..3 : x > 1} : [a |-> 1, b |-> TRUE]} : (TRUE \/ <<5, 6>>)) :> CASE ((SUBSET {1} \cup {1}) = {b15239 \in Nat : FALSE}) -> Cardinality({3, 0}) [] OTHER -> Cardinality(({} \ {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09813 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a record.
    line 14, col 223 to line 14, col 243 of module random_09813
---*)
