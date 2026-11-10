(*---
description: Evaluates a random set expression, seed 262, number 1172.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01172 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 \div 2) .. (3 \div -1)) \cup {(-2147483647), (--1)}) \ (DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 0] \cap {b1878 \in (Nat .. [x \in 1..2 |-> x]) : (b1878 \in {1})})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 36 to line 14, col 39 of module random_01172 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 34.
    | Expression starting at line 14, column 34.
    | ExtendableExpr starting at line 14, column 33.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | Fatal errors while parsing TLA+ spec in file random_01172
    | In module random_01172
    | Could not parse module random_01172 from file random_01172.tla
    | *** Errors: 1
    | In module random_01172
    | Could not parse module random_01172 from file random_01172.tla
    3002:1 Parsing or semantic analysis failed.
---*)
