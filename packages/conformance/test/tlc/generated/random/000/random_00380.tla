(*---
description: Evaluates a random bool expression, seed 262, number 380.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00380 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b626 == ((3 * -1) \div CASE TRUE -> 1 [] OTHER -> 7) IN ((CHOOSE r \in [a : 2..1] : TRUE) * ([a |-> 1]).a) < Len(([<<>> EXCEPT ![1] = 7] \o <<7, <<1>>>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 33 to line 14, col 33 of module random_00380 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 31.
    | Expression starting at line 14, column 31.
    | ExtendableExpr starting at line 14, column 30.
    | Expression starting at line 14, column 30.
    | ExtendableExpr starting at line 14, column 29.
    | Fatal errors while parsing TLA+ spec in file random_00380
    | In module random_00380
    | Could not parse module random_00380 from file random_00380.tla
    | *** Errors: 1
    | In module random_00380
    | Could not parse module random_00380 from file random_00380.tla
    3002:1 Parsing or semantic analysis failed.
---*)
