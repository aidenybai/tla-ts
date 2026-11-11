(*---
description: Evaluates a random bool expression, seed 262, number 9835.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09835 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = IF FALSE THEN 7 ELSE 1] = ((--1) :> (0 - 2))) <=> (SortSeq(<<3, 1>>, LAMBDA p, q : p < q) = (((1 :> 2) @@ [x \in Nat |-> x + 1]) @@ ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 104 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 101.
    | Expression starting at line 14, column 101.
    | ExtendableExpr starting at line 14, column 100.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_09835
    | In module random_09835
    | Could not parse module random_09835 from file random_09835.tla
    | *** Errors: 1
    | In module random_09835
    | Could not parse module random_09835 from file random_09835.tla
    3002:1 Parsing or semantic analysis failed.
---*)
