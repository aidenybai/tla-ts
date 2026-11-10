(*---
description: Evaluates a random bool expression, seed 262, number 4842.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04842 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b7558 \in (2147483647 .. 0) |-> CASE FALSE -> b7558 [] OTHER -> b7558] => ((Nat = 2..1) => (Nat \subseteq {}))) <=> (((TRUE => 3) => SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) /\ ({3, 0} \subseteq ({2, 1, 3} \ SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04842 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 18 to line 14, col 128 of module random_04842
---*)
