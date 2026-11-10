(*---
description: Evaluates a random set expression, seed 262, number 5405.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05405 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(([a |-> 1]).a \div Cardinality({})), ((7 + 2) \div (--1))} \cap (({-1 : b8373 \in 2..1} \ {b8374 \in Nat : FALSE}) \cup ((Nat \cup {}) \ UNION {{x \in 1..3 : x > 1}, {}}))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 73 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 70.
    | ExtendableExpr starting at line 14, column 57.
    | Expression starting at line 14, column 57.
    | ExtendableExpr starting at line 14, column 56.
    | Expression starting at line 14, column 56.
    | Fatal errors while parsing TLA+ spec in file random_05405
    | In module random_05405
    | Could not parse module random_05405 from file random_05405.tla
    | *** Errors: 1
    | In module random_05405
    | Could not parse module random_05405 from file random_05405.tla
    3002:1 Parsing or semantic analysis failed.
---*)
