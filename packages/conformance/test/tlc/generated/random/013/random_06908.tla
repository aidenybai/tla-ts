(*---
description: Evaluates a random set expression, seed 262, number 6908.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06908 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (([x \in Nat |-> x + 1] @@ <<5, 6>>) @@ (CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE)) \cup (CASE (2 = 2147483647) -> ([a |-> 1]).a [] OTHER -> (--1) .. Cardinality((2..1 \cup {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 178 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 175.
    | Expression starting at line 14, column 175.
    | Case Other Arm starting at line 14, column 166.
    | CASE Expression starting at line 14, column 124.
    | Expression starting at line 14, column 124.
    | Fatal errors while parsing TLA+ spec in file random_06908
    | In module random_06908
    | Could not parse module random_06908 from file random_06908.tla
    | *** Errors: 1
    | In module random_06908
    | Could not parse module random_06908 from file random_06908.tla
    3002:1 Parsing or semantic analysis failed.
---*)
