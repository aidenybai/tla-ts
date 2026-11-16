(*---
description: Evaluates a random set expression, seed 262, number 8108.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08108 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)) -> ((0 \div -1) + (2 * 1)) [] OTHER -> (-CASE FALSE -> 3 [] OTHER -> 1) % (Len([<<3, 1, 2>> EXCEPT ![1] = 7]) * Cardinality((-1 .. <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 117 to line 14, col 120 of module random_08108 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 115.
    | Expression starting at line 14, column 115.
    | ExtendableExpr starting at line 14, column 114.
    | Expression starting at line 14, column 114.
    | ExtendableExpr starting at line 14, column 113.
    | Fatal errors while parsing TLA+ spec in file random_08108
    | In module random_08108
    | Could not parse module random_08108 from file random_08108.tla
    | *** Errors: 1
    | In module random_08108
    | Could not parse module random_08108 from file random_08108.tla
    3002:1 Parsing or semantic analysis failed.
---*)
