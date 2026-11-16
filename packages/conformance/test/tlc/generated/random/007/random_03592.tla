(*---
description: Evaluates a random set expression, seed 262, number 3592.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03592 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{b5663 \in {b5664 \in SUBSET {1} : FALSE} : (7 < b5663)}, UNION {[[a |-> 1] EXCEPT !.a = @ + <<1>>], (<<3, 1, 2>> .. 1)}} \cap {(([a |-> 1]).a % (2147483647 % 3)), ((<<5, 6>>)[2] % (--1))}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 208 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 205.
    | ExtendableExpr starting at line 14, column 189.
    | Expression starting at line 14, column 189.
    | ExtendableExpr starting at line 14, column 188.
    | Expression starting at line 14, column 188.
    | Fatal errors while parsing TLA+ spec in file random_03592
    | In module random_03592
    | Could not parse module random_03592 from file random_03592.tla
    | *** Errors: 1
    | In module random_03592
    | Could not parse module random_03592 from file random_03592.tla
    3002:1 Parsing or semantic analysis failed.
---*)
