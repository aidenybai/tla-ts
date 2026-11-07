(*---
description: Evaluates a random bool expression, seed 262, number 8819.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08819 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((--1) \div (2 - -1)) < ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a) => [b13654 \in ({0, -1} \cup {2, 2147483647}) |-> ((<<5, 6>>)[b13654] \div (CHOOSE b13655 \in {1} : TRUE))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 22 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_08819
    | In module random_08819
    | Could not parse module random_08819 from file random_08819.tla
    | *** Errors: 1
    | In module random_08819
    | Could not parse module random_08819 from file random_08819.tla
    3002:1 Parsing or semantic analysis failed.
---*)
