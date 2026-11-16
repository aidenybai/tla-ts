(*---
description: Evaluates a random int expression, seed 262, number 6757.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06757 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((CHOOSE f \in [1..2 -> {1, 2}] : TRUE) @@ ([x \in Nat |-> x + 1] @@ <<5, 6>>)) EXCEPT ![([[a |-> 1] EXCEPT !.a = @ + 2] + (--1))] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a] % ((CHOOSE r \in [a : {}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 144 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 141.
    | ExtendableExpr starting at line 14, column 108.
    | Expression starting at line 14, column 108.
    | ExtendableExpr starting at line 14, column 107.
    | Expression starting at line 14, column 107.
    | Fatal errors while parsing TLA+ spec in file random_06757
    | In module random_06757
    | Could not parse module random_06757 from file random_06757.tla
    | *** Errors: 1
    | In module random_06757
    | Could not parse module random_06757 from file random_06757.tla
    3002:1 Parsing or semantic analysis failed.
---*)
