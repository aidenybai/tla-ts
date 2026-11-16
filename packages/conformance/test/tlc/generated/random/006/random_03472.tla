(*---
description: Evaluates a random record expression, seed 262, number 3472.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03472 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (\E b5488 \in [x \in 1..2 |-> x] : TRUE) -> Head(<<>>) [] OTHER -> Append(<<1, 2>>, 2), b |-> (SelectSeq(<<1>>, LAMBDA e : e > 0) = ([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]))] EXCEPT !.a = @ + IF ((TRUE <=> TRUE) => (<<>> = (1 :> 2))) THEN (([a |-> 1]).a - (CHOOSE b5489 \in {1, 2} : FALSE)) ELSE (CASE Nat -> 2 [] OTHER -> 0 + (-2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03472 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1, 2>>.
    line 14, col 43 to line 14, col 60 of module random_03472
---*)
