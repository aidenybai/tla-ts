(*---
description: Evaluates a random set expression, seed 262, number 4284.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04284 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CASE (TRUE /\ TRUE) -> IF TRUE THEN -1 ELSE -1 [] OTHER -> ([x \in Nat |-> x + 1])[2147483647] + ((CHOOSE r \in [a : {1, 2}] : TRUE)).a), IF ([b6745 \in SUBSET {1} |-> b6745])[(-7)] THEN (Cardinality({2, 1, 3}) \div (1 + 2147483647)) ELSE ((--1) * (3 * 7))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 261 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 258.
    | Expression starting at line 14, column 258.
    | ExtendableExpr starting at line 14, column 257.
    | Expression starting at line 14, column 257.
    | IF THEN ELSE starting at line 14, column 156.
    | Fatal errors while parsing TLA+ spec in file random_04284
    | In module random_04284
    | Could not parse module random_04284 from file random_04284.tla
    | *** Errors: 1
    | In module random_04284
    | Could not parse module random_04284 from file random_04284.tla
    3002:1 Parsing or semantic analysis failed.
---*)
