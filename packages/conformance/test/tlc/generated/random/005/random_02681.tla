(*---
description: Evaluates a random seq expression, seed 262, number 2681.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02681 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\E b4238 \in (Nat \ 2..1) : (1 < b4238)) -> ((CHOOSE f \in [{} -> 2..1] : TRUE))[LET b4239 == 7 IN 3] [] OTHER -> ((-[a |-> 1, b |-> TRUE]) - Head(<<>>)) :> ((Cardinality(FALSE) * (1 + [x \in 1..2 |-> x])) \div (CHOOSE b4240 \in (SUBSET {1} \cap SUBSET {1}) : (TRUE \/ (1 :> 2))))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02681 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
