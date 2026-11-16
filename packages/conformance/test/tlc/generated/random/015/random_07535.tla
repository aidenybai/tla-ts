(*---
description: Evaluates a random bool expression, seed 262, number 7535.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07535 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1]).a * (--1)) * Cardinality(DOMAIN <<5, 6>>)) :> (CHOOSE b11615 \in ((1 .. 7) \ SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) : (SortSeq(<<1, 2>>, LAMBDA p, q : p < q) = [<<5, 6>> EXCEPT ![b11615] = b11615]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 38 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 35.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_07535
    | In module random_07535
    | Could not parse module random_07535 from file random_07535.tla
    | *** Errors: 1
    | In module random_07535
    | Could not parse module random_07535 from file random_07535.tla
    3002:1 Parsing or semantic analysis failed.
---*)
