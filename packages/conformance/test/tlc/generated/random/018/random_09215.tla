(*---
description: Evaluates a random set expression, seed 262, number 9215.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09215 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ([[a |-> 1] EXCEPT !.a = @ + 7] = [a |-> -1, b |-> TRUE]) THEN Cardinality({-1, 0}) ELSE ([[x \in 1..2 |-> x] EXCEPT ![0] = 2147483647])[([x \in 1..2 |-> x])[2]] .. Cardinality((Len(<<>>) .. (--1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 214 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 211.
    | ExtendableExpr starting at line 14, column 198.
    | Expression starting at line 14, column 198.
    | ExtendableExpr starting at line 14, column 197.
    | Expression starting at line 14, column 197.
    | Fatal errors while parsing TLA+ spec in file random_09215
    | In module random_09215
    | Could not parse module random_09215 from file random_09215.tla
    | *** Errors: 1
    | In module random_09215
    | Could not parse module random_09215 from file random_09215.tla
    3002:1 Parsing or semantic analysis failed.
---*)
