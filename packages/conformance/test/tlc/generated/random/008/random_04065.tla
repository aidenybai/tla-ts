(*---
description: Evaluates a random set expression, seed 262, number 4065.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04065 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(CASE TRUE -> 3 [] OTHER -> 2 + (2 \div 0)), (Cardinality({x \in 1..3 : x > 1}) - Len(<<3, 1, 2>>))} \cap (DOMAIN [(1 :> 2) EXCEPT ![7] = 3] \cup [[<<>> EXCEPT ![1] = -1] EXCEPT !.a = @ + (3 * -1)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 209 to line 14, col 209 of module random_04065 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 207.
    | Expression starting at line 14, column 207.
    | ExtendableExpr starting at line 14, column 206.
    | ExtendableExpr starting at line 14, column 202.
    | Expression starting at line 14, column 202.
    | Fatal errors while parsing TLA+ spec in file random_04065
    | In module random_04065
    | Could not parse module random_04065 from file random_04065.tla
    | *** Errors: 1
    | In module random_04065
    | Could not parse module random_04065 from file random_04065.tla
    3002:1 Parsing or semantic analysis failed.
---*)
