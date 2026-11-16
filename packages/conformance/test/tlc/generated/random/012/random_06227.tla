(*---
description: Evaluates a random int expression, seed 262, number 6227.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06227 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([({b9581 \in 2..1 : FALSE} \cap ({1} \ {1, 2})) EXCEPT ![[a |-> (3 * 0), b |-> (~{1})]] = IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN ([a |-> 1]).a ELSE LET b9582 == -1 IN 0])[CASE ({7 : b9583 \in {1, 2}} = DOMAIN <<5, 6>>) -> ((-1 \in 1..3) % (<<5, 6>>)[7]) [] OTHER -> ((CHOOSE b9584 \in 1..3 : FALSE) * (--1))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 326 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 323.
    | ExtendableExpr starting at line 14, column 289.
    | Expression starting at line 14, column 289.
    | ExtendableExpr starting at line 14, column 288.
    | Expression starting at line 14, column 288.
    | Fatal errors while parsing TLA+ spec in file random_06227
    | In module random_06227
    | Could not parse module random_06227 from file random_06227.tla
    | *** Errors: 1
    | In module random_06227
    | Could not parse module random_06227 from file random_06227.tla
    3002:1 Parsing or semantic analysis failed.
---*)
