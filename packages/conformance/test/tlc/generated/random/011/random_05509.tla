(*---
description: Evaluates a random int expression, seed 262, number 5509.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05509 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b8513 \in UNION {((1 * -1) .. CASE FALSE -> 3 [] OTHER -> 3), ((~TRUE) \cap (2 .. 3))} : ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = Len(<<1>>)] = [[[a |-> 1] EXCEPT !.a = @ + b8513] EXCEPT !.a = (b8513 + [x \in 1..2 |-> x])])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 45 to line 14, col 45 of module random_05509 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 43.
    | Expression starting at line 14, column 43.
    | ExtendableExpr starting at line 14, column 42.
    | Expression starting at line 14, column 42.
    | ExtendableExpr starting at line 14, column 41.
    | Fatal errors while parsing TLA+ spec in file random_05509
    | In module random_05509
    | Could not parse module random_05509 from file random_05509.tla
    | *** Errors: 1
    | In module random_05509
    | Could not parse module random_05509 from file random_05509.tla
    3002:1 Parsing or semantic analysis failed.
---*)
